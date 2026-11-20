-- Somente teste. 19 perfis de referência oficiais do Roster 2024.
-- Não cria usuários em auth.users e não apaga dados já presentes.
-- Executar após supabase/migrations/20261115000100_collaborative_profiles.sql.
insert into public.participants (id,nome,apelido,bio) values
  ('00000000-0000-4000-8000-000000000001', 'André Cirri', 'coach', ''),
  ('00000000-0000-4000-8000-000000000002', 'Antonio Rodrigues', 'lako', ''),
  ('00000000-0000-4000-8000-000000000003', 'Artur Safi', 'Sazo', ''),
  ('00000000-0000-4000-8000-000000000004', 'Eduardo Rossi', 'doc', ''),
  ('00000000-0000-4000-8000-000000000005', 'Fabio Puliti', 'Bão', ''),
  ('00000000-0000-4000-8000-000000000006', 'Felipe Kumagae', 'fer', ''),
  ('00000000-0000-4000-8000-000000000007', 'Gabriel Amadei', 'amadola', ''),
  ('00000000-0000-4000-8000-000000000008', 'Gabriel Erlichman', 'erli', ''),
  ('00000000-0000-4000-8000-000000000009', 'Gabriel Junqueira', 'gush', ''),
  ('00000000-0000-4000-8000-000000000010', 'Guilherme Alves', 'Gui', ''),
  ('00000000-0000-4000-8000-000000000011', 'João Caetano', 'klint', ''),
  ('00000000-0000-4000-8000-000000000012', 'João Pedro Barros', 'evans', ''),
  ('00000000-0000-4000-8000-000000000013', 'João Prata', 'teco', ''),
  ('00000000-0000-4000-8000-000000000014', 'Joaquim Coelho', 'gojo', ''),
  ('00000000-0000-4000-8000-000000000015', 'Matheus Liberado', 'Libe', ''),
  ('00000000-0000-4000-8000-000000000016', 'Murilo Safi', 'Bruno', ''),
  ('00000000-0000-4000-8000-000000000017', 'Pedro Jorge Neto', 'trick', ''),
  ('00000000-0000-4000-8000-000000000018', 'Renato Costa', 'reba', ''),
  ('00000000-0000-4000-8000-000000000019', 'Thiago Davantel', 'honesto', '')
on conflict (id) do nothing;
