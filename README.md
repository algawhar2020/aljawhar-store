# الجوهر | AL JAWHAR — صفحة "قريبًا"

الموقع حاليًا صفحة "قريبًا" فقط (بدون منتجات أو أسعار أو سلة أو طلبات).

## استعادة المتجر الكامل لاحقًا
نسخة المتجر الكاملة محفوظة في الفرع `store-full` والوسم `store-v1`. لإعادتها:

```bash
git checkout main
git checkout store-v1 -- .      # يعيد كل ملفات المتجر كما كانت
git rm -q assets/logo-cs.png assets/og-coming-soon.jpg   # (اختياري) حذف ملفات صفحة قريبًا
git commit -m "Restore full store" && git push origin main
```
(أو من إعدادات GitHub Pages اختر الفرع `store-full` كمصدر للنشر.)
