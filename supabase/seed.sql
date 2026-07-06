-- Default categories. Safe to re-run: skips names that already exist.
insert into categories (name, icon)
select v.name, v.icon
from (
  values
    ('อาหาร', 'Utensils'),
    ('เดินทาง', 'Car'),
    ('ของใช้ในบ้าน', 'Home'),
    ('บันเทิง', 'Film'),
    ('สุขภาพ', 'HeartPulse'),
    ('การศึกษา', 'GraduationCap'),
    ('ช้อปปิ้ง', 'ShoppingBag'),
    ('อื่นๆ', 'MoreHorizontal')
) as v(name, icon)
where not exists (
  select 1 from categories c where c.name = v.name
);
