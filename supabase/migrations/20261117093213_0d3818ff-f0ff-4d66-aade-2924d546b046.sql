REVOKE EXECUTE ON FUNCTION public.can_view_coparenting(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_coparenting(uuid) TO authenticated;