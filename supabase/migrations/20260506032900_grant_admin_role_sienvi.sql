-- Grant admin role to admin@sienvi.com
-- The user was created via the admin API with id: 8fcefdc8-6d2b-474e-8615-25b713b60b81

INSERT INTO public.user_roles (user_id, role)
VALUES ('8fcefdc8-6d2b-474e-8615-25b713b60b81', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
