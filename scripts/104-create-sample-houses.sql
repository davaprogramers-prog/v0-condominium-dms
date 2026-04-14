-- 104-create-sample-houses.sql
-- CREAR 5 CASAS PARA EL CONDOMINIO TEST

INSERT INTO public.houses (condo_id, house_number, created_at)
SELECT 
  (SELECT id FROM public.condominiums WHERE name = 'Condominio Test' LIMIT 1),
  (100 + num::int),
  NOW()
FROM generate_series(1, 5) AS num;

-- Verificar que las casas fueron creadas
SELECT 'CASAS CREADAS' as status;
SELECT id, house_number, condo_id FROM public.houses WHERE condo_id = (SELECT id FROM public.condominiums WHERE name = 'Condominio Test') ORDER BY house_number;
