-- Add avatar URLs to the 5 original seed creators that were missing them
-- Run in Supabase SQL Editor

update public.creator_profiles set avatar_url = 'https://i.pravatar.cc/400?img=5'  where slug = 'priya-sharma'  and avatar_url is null;
update public.creator_profiles set avatar_url = 'https://i.pravatar.cc/400?img=13' where slug = 'arjun-mehta'   and avatar_url is null;
update public.creator_profiles set avatar_url = 'https://i.pravatar.cc/400?img=9'  where slug = 'divya-nair'    and avatar_url is null;
update public.creator_profiles set avatar_url = 'https://i.pravatar.cc/400?img=14' where slug = 'rohit-bansal'  and avatar_url is null;
update public.creator_profiles set avatar_url = 'https://i.pravatar.cc/400?img=16' where slug = 'neha-gupta'    and avatar_url is null;

-- Verify
select slug, display_name, avatar_url from public.creator_profiles
where slug in ('priya-sharma','arjun-mehta','divya-nair','rohit-bansal','neha-gupta')
order by slug;
