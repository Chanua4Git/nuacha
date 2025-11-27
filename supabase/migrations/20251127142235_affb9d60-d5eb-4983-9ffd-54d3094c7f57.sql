-- Insert chanuajohnson4@gmail.com as admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('27182ba6-fe5d-431e-9302-c0c7e71597c0', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;