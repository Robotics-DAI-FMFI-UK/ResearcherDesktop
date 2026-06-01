DELETE FROM category_fields cf
WHERE cf.name IN ('Name', 'Title')
  AND cf.field_type = 'TEXT'
  AND EXISTS (
      SELECT 1 FROM categories c
      WHERE c.id = cf.category_id AND c.is_predefined = TRUE
  );

UPDATE category_fields cf
SET sort_order = sub.new_order
FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY sort_order) - 1 AS new_order
    FROM category_fields
) sub
WHERE cf.id = sub.id;
