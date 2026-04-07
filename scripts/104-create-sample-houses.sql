-- 104-create-sample-houses.sql
-- CREAR 5 CASAS PARA EL CONDOMINIO TEST

INSERT INTO public.houses (condo_id, created_at)
SELECT 
  (SELECT id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1),
  NOW()
FROM generate_series(1, 5);

-- Verificar que las casas fueron creadas
SELECT 'CASAS CREADAS' as status;
SELECT COUNT(*) as total_casas FROM public.houses WHERE condo_id = (SELECT id FROM public.condominiums WHERE name = 'Condominio Test');
