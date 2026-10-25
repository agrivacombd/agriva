ALTER POLICY farm_expenses_owner_insert
  ON public.farm_expenses
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.farms f
      WHERE f.id = farm_expenses.farm_id
        AND f.owner_id = (SELECT auth.uid())
    )
    AND (
      crop_cycle_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.crop_cycles c
        WHERE c.id = farm_expenses.crop_cycle_id
          AND c.farm_id = farm_expenses.farm_id
          AND c.owner_id = (SELECT auth.uid())
      )
    )
  );

ALTER POLICY farm_expenses_owner_update
  ON public.farm_expenses
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.farms f
      WHERE f.id = farm_expenses.farm_id
        AND f.owner_id = (SELECT auth.uid())
    )
    AND (
      crop_cycle_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.crop_cycles c
        WHERE c.id = farm_expenses.crop_cycle_id
          AND c.farm_id = farm_expenses.farm_id
          AND c.owner_id = (SELECT auth.uid())
      )
    )
  );

ALTER POLICY farm_sales_owner_insert
  ON public.farm_sales
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.farms f
      WHERE f.id = farm_sales.farm_id
        AND f.owner_id = (SELECT auth.uid())
    )
    AND (
      crop_cycle_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.crop_cycles c
        WHERE c.id = farm_sales.crop_cycle_id
          AND c.farm_id = farm_sales.farm_id
          AND c.owner_id = (SELECT auth.uid())
      )
    )
  );

ALTER POLICY farm_sales_owner_update
  ON public.farm_sales
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.farms f
      WHERE f.id = farm_sales.farm_id
        AND f.owner_id = (SELECT auth.uid())
    )
    AND (
      crop_cycle_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.crop_cycles c
        WHERE c.id = farm_sales.crop_cycle_id
          AND c.farm_id = farm_sales.farm_id
          AND c.owner_id = (SELECT auth.uid())
      )
    )
  );
