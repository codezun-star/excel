-- =============================================================================
-- Excel Codezun — 003: almacenamiento privado para comprobantes de pago
-- Bucket privado `payment-proofs`. Los archivos se suben SOLO desde el servidor
-- (server action con la clave secreta) en la ruta <user_id>/<referencia>.<ext>.
-- El usuario puede ver sus propios comprobantes; los admins, todos.
-- Idempotente.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Lectura: el dueño (primera carpeta = su id) o un admin. No hay políticas de
-- insert/update/delete: solo el rol de servicio (que ignora RLS) escribe.
drop policy if exists "payment-proofs: ver propios" on storage.objects;
create policy "payment-proofs: ver propios" on storage.objects for select to authenticated
  using (
    bucket_id = 'payment-proofs'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );
