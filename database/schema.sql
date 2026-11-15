-- ZYNEX | Cloudflare D1 schema
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS system_settings (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 setting_key TEXT NOT NULL UNIQUE,
 setting_value TEXT NOT NULL DEFAULT '',
 category TEXT NOT NULL DEFAULT 'general',
 description TEXT DEFAULT '',
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nex_knowledge (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT NOT NULL,
 content TEXT NOT NULL DEFAULT '',
 knowledge_type TEXT NOT NULL DEFAULT 'custom',
 is_active INTEGER NOT NULL DEFAULT 1,
 sort_order INTEGER NOT NULL DEFAULT 0,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nex_skills (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 skill_name TEXT NOT NULL,
 skill_description TEXT DEFAULT '',
 skill_instructions TEXT NOT NULL DEFAULT '',
 skill_category TEXT DEFAULT 'general',
 is_active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 full_name TEXT NOT NULL,
 whatsapp_number TEXT NOT NULL,
 email TEXT DEFAULT '',
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON customers(whatsapp_number);

CREATE TABLE IF NOT EXISTS nex_conversations (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 session_id TEXT NOT NULL UNIQUE,
 customer_id INTEGER,
 is_active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 last_activity TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS nex_messages (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 conversation_id INTEGER NOT NULL,
 sender TEXT NOT NULL,
 message TEXT NOT NULL,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(conversation_id) REFERENCES nex_conversations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON nex_messages(conversation_id);

CREATE TABLE IF NOT EXISTS orders (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 order_number TEXT NOT NULL UNIQUE,
 reference_code TEXT NOT NULL UNIQUE,
 customer_id INTEGER NOT NULL,
 session_id TEXT DEFAULT '',
 service_name TEXT NOT NULL,
 package_name TEXT DEFAULT '',
 order_details TEXT DEFAULT '',
 customer_notes TEXT DEFAULT '',
 order_status TEXT NOT NULL DEFAULT 'new',
 source TEXT DEFAULT 'nex',
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_reference ON orders(reference_code);

CREATE TABLE IF NOT EXISTS order_history (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 order_id INTEGER NOT NULL,
 action TEXT NOT NULL,
 old_data TEXT DEFAULT '',
 new_data TEXT DEFAULT '',
 performed_by TEXT DEFAULT 'nex',
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_sessions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 token_hash TEXT NOT NULL UNIQUE,
 expires_at TEXT NOT NULL,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 last_activity TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);

CREATE TABLE IF NOT EXISTS services (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 service_name TEXT NOT NULL,
 service_description TEXT DEFAULT '',
 price TEXT DEFAULT '',
 billing_type TEXT DEFAULT '',
 features TEXT DEFAULT '',
 is_active INTEGER NOT NULL DEFAULT 1,
 sort_order INTEGER DEFAULT 0,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 project_name TEXT NOT NULL,
 project_description TEXT DEFAULT '',
 project_url TEXT DEFAULT '',
 image_url TEXT DEFAULT '',
 category TEXT DEFAULT '',
 is_featured INTEGER DEFAULT 0,
 is_active INTEGER DEFAULT 1,
 sort_order INTEGER DEFAULT 0,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blog_posts (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT NOT NULL,
 slug TEXT NOT NULL UNIQUE,
 excerpt TEXT DEFAULT '',
 content TEXT DEFAULT '',
 image_url TEXT DEFAULT '',
 is_published INTEGER DEFAULT 0,
 published_at TEXT DEFAULT NULL,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_activity (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 action TEXT NOT NULL,
 target_type TEXT DEFAULT '',
 target_id TEXT DEFAULT '',
 description TEXT DEFAULT '',
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO system_settings(setting_key,setting_value,category,description) VALUES
('site_name','ZYNEX','general','اسم الشركة'),
('site_tagline','حلول رقمية متخصصة للقطاع الطبي','general','الشعار التعريفي'),
('nex_enabled','true','nex','تفعيل NEX'),
('nex_model','openai/gpt-oss-120b','nex','نموذج الذكاء الاصطناعي'),
('nex_personality','','nex','شخصية NEX'),
('nex_rules','','nex','قواعد NEX'),
('company_information','ZYNEX | Digital Solutions. حلول رقمية متخصصة للقطاع الطبي.','company','معلومات الشركة'),
('company_pricing','لا تعتمد أي أسعار إلا الأسعار المسجلة والمعتمدة في قسم الخدمات.','pricing','سياسة الأسعار');

INSERT INTO nex_skills(skill_name,skill_description,skill_instructions,skill_category,is_active)
SELECT 'خدمة العملاء','التواصل المهني مع زوار الموقع','افهم احتياج العميل، أجب بوضوح، لا تخترع معلومات أو أسعاراً، ولا تقدم وعوداً غير معتمدة.','customer_service',1
WHERE NOT EXISTS (SELECT 1 FROM nex_skills WHERE skill_name='خدمة العملاء');

INSERT INTO nex_skills(skill_name,skill_description,skill_instructions,skill_category,is_active)
SELECT 'تأهيل العملاء','فهم احتياج العميل وتحديد الخدمة المناسبة','اسأل أسئلة مختصرة لفهم النشاط والهدف والاحتياج، ثم اقترح الخدمة المسجلة الأنسب دون ضغط.','sales',1
WHERE NOT EXISTS (SELECT 1 FROM nex_skills WHERE skill_name='تأهيل العملاء');

INSERT INTO services(service_name,service_description,price,billing_type,features,is_active,sort_order)
SELECT 'Landing Page','صفحة هبوط احترافية للعيادات والمنشآت الطبية، مصممة لتحويل الزوار إلى استفسارات.','50 USD / month','اشتراك شهري','تصميم متجاوب، زر واتساب، استضافة وإدارة ZYNEX',1,1
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_name='Landing Page');

INSERT INTO services(service_name,service_description,price,billing_type,features,is_active,sort_order)
SELECT 'Website','موقع متعدد الصفحات يعرض المنشأة وخدماتها وفريقها وطرق التواصل.','100 USD / month','اشتراك شهري','صفحات متعددة، تصميم متجاوب، استضافة وإدارة ZYNEX',1,2
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_name='Website');
