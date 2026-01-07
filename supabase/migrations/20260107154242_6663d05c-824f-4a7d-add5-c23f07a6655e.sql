-- =====================================================
-- FLEET MANAGEMENT TABLES
-- =====================================================

-- 1. Fleet Owners table (propriétaires de flottes)
CREATE TABLE public.fleet_owners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  company_name TEXT,
  business_registration TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  address TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Fleet Vehicles table (véhicules appartenant à une flotte)
CREATE TABLE public.fleet_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fleet_owner_id UUID NOT NULL REFERENCES public.fleet_owners(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  purchase_date DATE,
  purchase_price INTEGER,
  insurance_expiry DATE,
  technical_control_expiry DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vehicle_id)
);

-- 3. Driver Assignments table (affectation des chauffeurs aux véhicules)
CREATE TABLE public.driver_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fleet_vehicle_id UUID NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  assignment_type TEXT NOT NULL DEFAULT 'permanent' CHECK (assignment_type IN ('permanent', 'rotation', 'temporary', 'backup')),
  shift_type TEXT CHECK (shift_type IN ('day', 'night', 'full', 'custom')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  daily_target INTEGER,
  commission_rate NUMERIC(5,2) DEFAULT 20.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Driver Expenses table (dépenses des chauffeurs)
CREATE TABLE public.driver_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  fleet_vehicle_id UUID REFERENCES public.fleet_vehicles(id),
  expense_type TEXT NOT NULL CHECK (expense_type IN ('fuel', 'maintenance', 'insurance', 'fine', 'wash', 'toll', 'parking', 'other')),
  amount INTEGER NOT NULL,
  description TEXT,
  receipt_url TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_reimbursed BOOLEAN DEFAULT false,
  reimbursed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Daily Driver Reports table (rapports journaliers)
CREATE TABLE public.driver_daily_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  fleet_vehicle_id UUID REFERENCES public.fleet_vehicles(id),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_trips INTEGER DEFAULT 0,
  total_distance_km NUMERIC(10,2) DEFAULT 0,
  gross_earnings INTEGER DEFAULT 0,
  total_expenses INTEGER DEFAULT 0,
  net_earnings INTEGER DEFAULT 0,
  commission_amount INTEGER DEFAULT 0,
  driver_share INTEGER DEFAULT 0,
  owner_share INTEGER DEFAULT 0,
  notes TEXT,
  is_validated BOOLEAN DEFAULT false,
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(driver_id, report_date)
);

-- =====================================================
-- SECURITY DEFINER FUNCTIONS (to avoid RLS recursion)
-- =====================================================

-- Check if user is a fleet owner
CREATE OR REPLACE FUNCTION public.is_fleet_owner(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fleet_owners
    WHERE user_id = p_user_id AND is_active = true
  );
$$;

-- Get fleet owner ID for a user
CREATE OR REPLACE FUNCTION public.get_fleet_owner_id(p_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.fleet_owners
  WHERE user_id = p_user_id AND is_active = true
  LIMIT 1;
$$;

-- Check if user owns a specific fleet vehicle
CREATE OR REPLACE FUNCTION public.owns_fleet_vehicle(p_user_id UUID, p_fleet_vehicle_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fleet_vehicles fv
    JOIN public.fleet_owners fo ON fo.id = fv.fleet_owner_id
    WHERE fo.user_id = p_user_id AND fv.id = p_fleet_vehicle_id
  );
$$;

-- Check if driver is assigned to a fleet
CREATE OR REPLACE FUNCTION public.is_driver_in_fleet(p_driver_id UUID, p_fleet_owner_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.driver_assignments da
    JOIN public.fleet_vehicles fv ON fv.id = da.fleet_vehicle_id
    WHERE da.driver_id = p_driver_id 
      AND fv.fleet_owner_id = p_fleet_owner_id 
      AND da.is_active = true
  );
$$;

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE public.fleet_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_daily_reports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - Fleet Owners
-- =====================================================

-- Users can view their own fleet owner profile
CREATE POLICY "Users can view their own fleet profile"
ON public.fleet_owners FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own fleet owner profile
CREATE POLICY "Users can create their own fleet profile"
ON public.fleet_owners FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own fleet owner profile
CREATE POLICY "Users can update their own fleet profile"
ON public.fleet_owners FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES - Fleet Vehicles
-- =====================================================

-- Fleet owners can view their vehicles
CREATE POLICY "Fleet owners can view their vehicles"
ON public.fleet_vehicles FOR SELECT
USING (fleet_owner_id = public.get_fleet_owner_id(auth.uid()));

-- Fleet owners can add vehicles to their fleet
CREATE POLICY "Fleet owners can add vehicles"
ON public.fleet_vehicles FOR INSERT
WITH CHECK (fleet_owner_id = public.get_fleet_owner_id(auth.uid()));

-- Fleet owners can update their vehicles
CREATE POLICY "Fleet owners can update their vehicles"
ON public.fleet_vehicles FOR UPDATE
USING (fleet_owner_id = public.get_fleet_owner_id(auth.uid()))
WITH CHECK (fleet_owner_id = public.get_fleet_owner_id(auth.uid()));

-- Fleet owners can remove vehicles
CREATE POLICY "Fleet owners can delete their vehicles"
ON public.fleet_vehicles FOR DELETE
USING (fleet_owner_id = public.get_fleet_owner_id(auth.uid()));

-- Drivers can view vehicles they're assigned to
CREATE POLICY "Drivers can view assigned vehicles"
ON public.fleet_vehicles FOR SELECT
USING (
  id IN (
    SELECT fleet_vehicle_id FROM public.driver_assignments
    WHERE driver_id = auth.uid() AND is_active = true
  )
);

-- =====================================================
-- RLS POLICIES - Driver Assignments
-- =====================================================

-- Fleet owners can view all assignments for their vehicles
CREATE POLICY "Fleet owners can view assignments"
ON public.driver_assignments FOR SELECT
USING (public.owns_fleet_vehicle(auth.uid(), fleet_vehicle_id));

-- Fleet owners can create assignments
CREATE POLICY "Fleet owners can create assignments"
ON public.driver_assignments FOR INSERT
WITH CHECK (public.owns_fleet_vehicle(auth.uid(), fleet_vehicle_id));

-- Fleet owners can update assignments
CREATE POLICY "Fleet owners can update assignments"
ON public.driver_assignments FOR UPDATE
USING (public.owns_fleet_vehicle(auth.uid(), fleet_vehicle_id))
WITH CHECK (public.owns_fleet_vehicle(auth.uid(), fleet_vehicle_id));

-- Fleet owners can delete assignments
CREATE POLICY "Fleet owners can delete assignments"
ON public.driver_assignments FOR DELETE
USING (public.owns_fleet_vehicle(auth.uid(), fleet_vehicle_id));

-- Drivers can view their own assignments
CREATE POLICY "Drivers can view their assignments"
ON public.driver_assignments FOR SELECT
USING (driver_id = auth.uid());

-- =====================================================
-- RLS POLICIES - Driver Expenses
-- =====================================================

-- Drivers can view their own expenses
CREATE POLICY "Drivers can view their expenses"
ON public.driver_expenses FOR SELECT
USING (driver_id = auth.uid());

-- Drivers can create their own expenses
CREATE POLICY "Drivers can create their expenses"
ON public.driver_expenses FOR INSERT
WITH CHECK (driver_id = auth.uid());

-- Drivers can update their own expenses (if not reimbursed)
CREATE POLICY "Drivers can update their expenses"
ON public.driver_expenses FOR UPDATE
USING (driver_id = auth.uid() AND is_reimbursed = false)
WITH CHECK (driver_id = auth.uid());

-- Fleet owners can view expenses for their drivers
CREATE POLICY "Fleet owners can view driver expenses"
ON public.driver_expenses FOR SELECT
USING (
  fleet_vehicle_id IS NOT NULL AND public.owns_fleet_vehicle(auth.uid(), fleet_vehicle_id)
);

-- Fleet owners can update expenses (for reimbursement)
CREATE POLICY "Fleet owners can update expenses"
ON public.driver_expenses FOR UPDATE
USING (
  fleet_vehicle_id IS NOT NULL AND public.owns_fleet_vehicle(auth.uid(), fleet_vehicle_id)
);

-- =====================================================
-- RLS POLICIES - Daily Reports
-- =====================================================

-- Drivers can view their own reports
CREATE POLICY "Drivers can view their reports"
ON public.driver_daily_reports FOR SELECT
USING (driver_id = auth.uid());

-- Drivers can create their own reports
CREATE POLICY "Drivers can create their reports"
ON public.driver_daily_reports FOR INSERT
WITH CHECK (driver_id = auth.uid());

-- Drivers can update their own reports (if not validated)
CREATE POLICY "Drivers can update their reports"
ON public.driver_daily_reports FOR UPDATE
USING (driver_id = auth.uid() AND is_validated = false)
WITH CHECK (driver_id = auth.uid());

-- Fleet owners can view reports for their drivers
CREATE POLICY "Fleet owners can view driver reports"
ON public.driver_daily_reports FOR SELECT
USING (
  fleet_vehicle_id IS NOT NULL AND public.owns_fleet_vehicle(auth.uid(), fleet_vehicle_id)
);

-- Fleet owners can update reports (for validation)
CREATE POLICY "Fleet owners can validate reports"
ON public.driver_daily_reports FOR UPDATE
USING (
  fleet_vehicle_id IS NOT NULL AND public.owns_fleet_vehicle(auth.uid(), fleet_vehicle_id)
);

-- =====================================================
-- TRIGGERS for updated_at
-- =====================================================
CREATE TRIGGER update_fleet_owners_updated_at
  BEFORE UPDATE ON public.fleet_owners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fleet_vehicles_updated_at
  BEFORE UPDATE ON public.fleet_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_assignments_updated_at
  BEFORE UPDATE ON public.driver_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_daily_reports_updated_at
  BEFORE UPDATE ON public.driver_daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX idx_fleet_vehicles_owner ON public.fleet_vehicles(fleet_owner_id);
CREATE INDEX idx_driver_assignments_vehicle ON public.driver_assignments(fleet_vehicle_id);
CREATE INDEX idx_driver_assignments_driver ON public.driver_assignments(driver_id);
CREATE INDEX idx_driver_expenses_driver ON public.driver_expenses(driver_id);
CREATE INDEX idx_driver_expenses_date ON public.driver_expenses(expense_date);
CREATE INDEX idx_driver_daily_reports_driver ON public.driver_daily_reports(driver_id);
CREATE INDEX idx_driver_daily_reports_date ON public.driver_daily_reports(report_date);