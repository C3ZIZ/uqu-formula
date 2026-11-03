-- Updates the gate's sample description now that visitors check themselves in. Admin-edited text stays as it is.
UPDATE "zones"
SET "details_ar" = 'امسح كود الدخول هنا لتسجيل حضورك.', "details_en" = 'Scan the entrance code here to check yourself in.'
WHERE "details_ar" = 'اعرض البادج هنا عند الدخول.';
