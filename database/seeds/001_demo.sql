-- Seed Data: 001_demo.sql
-- Demo seed records for testing and offline development
-- Safe to run multiple times (idempotent ON CONFLICT clauses)

BEGIN;

-- 1. Insert Demo Users (Password: 'Password123!' hashed with bcrypt for demo)
-- $2b$12$e80b.. hash for demo password
INSERT INTO users (id, email, full_name, password_hash, is_active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin@example.com', 'System Admin', '$2b$12$K8y5EeqwK/Q.4fJp2mHkXeFjSjXvQ5r1H1q8vT8R1qP1u3qK8y5Ee', true),
    ('22222222-2222-2222-2222-222222222222', 'researcher@example.com', 'Rita Researcher', '$2b$12$K8y5EeqwK/Q.4fJp2mHkXeFjSjXvQ5r1H1q8vT8R1qP1u3qK8y5Ee', true),
    ('33333333-3333-3333-3333-333333333333', 'campaigns@example.com', 'Carlos Campaigner', '$2b$12$K8y5EeqwK/Q.4fJp2mHkXeFjSjXvQ5r1H1q8vT8R1qP1u3qK8y5Ee', true),
    ('44444444-4444-4444-4444-444444444444', 'developer@example.com', 'Devon Developer', '$2b$12$K8y5EeqwK/Q.4fJp2mHkXeFjSjXvQ5r1H1q8vT8R1qP1u3qK8y5Ee', true)
ON CONFLICT (email) DO NOTHING;

-- Assign User Roles
INSERT INTO user_roles (user_id, role_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM roles WHERE name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT '22222222-2222-2222-2222-222222222222', id FROM roles WHERE name = 'researcher'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT '33333333-3333-3333-3333-333333333333', id FROM roles WHERE name = 'campaign_manager'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT '44444444-4444-4444-4444-444444444444', id FROM roles WHERE name = 'developer'
ON CONFLICT DO NOTHING;

-- 2. Insert Approved Sources
INSERT INTO sources (id, name, base_url, is_enabled, permitted_use_note, status) VALUES
    ('internshala', 'Internshala', 'https://internshala.com', true, 'Public internship and fresher job listings', 'healthy'),
    ('naukri', 'Naukri Freshers', 'https://www.naukri.com/fresher-jobs', true, 'Entry level 0-1 yr jobs', 'healthy'),
    ('apna', 'Apna Jobs', 'https://apna.co', true, 'Entry level fresher listings', 'healthy'),
    ('workindia', 'WorkIndia', 'https://www.workindia.in', true, 'Verified blue/grey and entry-level positions', 'healthy'),
    ('shine', 'Shine Freshers', 'https://www.shine.com', false, 'Public directory pending review', 'healthy'),
    ('hackathons', 'Devpost & Unstop', 'https://unstop.com', true, 'Student hackathon competitions', 'healthy'),
    ('college_tpo', 'TPO Public Directories', 'https://colleges.example.edu', true, 'Official college placement contacts', 'healthy'),
    ('startups', 'YCombinator Workatastartup', 'https://workatastartup.com', true, 'Early stage founder hiring', 'healthy')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Demo Organizations
INSERT INTO organizations (id, name, normalized_name, type, domain, website) VALUES
    ('a0000001-0000-0000-0000-000000000001', 'Acme AI Systems', 'acme ai systems', 'company', 'acmeai.example.com', 'https://acmeai.example.com'),
    ('a0000002-0000-0000-0000-000000000002', 'Beta Cloud Labs', 'beta cloud labs', 'startup', 'betacloud.example.com', 'https://betacloud.example.com'),
    ('a0000003-0000-0000-0000-000000000003', 'Gamma Data Fintech', 'gamma data fintech', 'company', 'gammadata.example.com', 'https://gammadata.example.com'),
    ('a0000004-0000-0000-0000-000000000004', 'Delta Robotics', 'delta robotics', 'startup', 'deltarobotics.example.com', 'https://deltarobotics.example.com'),
    ('a0000005-0000-0000-0000-000000000005', 'National Engineering Institute', 'national engineering institute', 'college', 'nei.example.edu', 'https://nei.example.edu'),
    ('a0000006-0000-0000-0000-000000000006', 'Epsilon Healthcare Tech', 'epsilon healthcare tech', 'company', 'epsilonhealth.example.com', 'https://epsilonhealth.example.com'),
    ('a0000007-0000-0000-0000-000000000007', 'Zeta Quantum Logistics', 'zeta quantum logistics', 'startup', 'zetaquantum.example.com', 'https://zetaquantum.example.com'),
    ('a0000008-0000-0000-0000-000000000008', 'Global Hackathon League', 'global hackathon league', 'organiser', 'hackleague.example.org', 'https://hackleague.example.org'),
    ('a0000009-0000-0000-0000-000000000009', 'Apex Cyber Defense', 'apex cyber defense', 'company', 'apexcyber.example.com', 'https://apexcyber.example.com'),
    ('a0000010-0000-0000-0000-000000000010', 'Starlight EdTech', 'starlight edtech', 'startup', 'starlight.example.com', 'https://starlight.example.com')
ON CONFLICT (normalized_name, COALESCE(domain, '')) DO NOTHING;

-- 4. Insert Demo Contacts & Methods
INSERT INTO contacts (id, organization_id, name, role_title) VALUES
    ('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Sarah Jenkins', 'Head of Talent Acquisition'),
    ('c0000002-0000-0000-0000-000000000002', 'a0000002-0000-0000-0000-000000000002', 'Marcus Vance', 'Founder & CTO'),
    ('c0000003-0000-0000-0000-000000000003', 'a0000003-0000-0000-0000-000000000003', 'Priya Sharma', 'University Recruitment Lead'),
    ('c0000005-0000-0000-0000-000000000005', 'a0000005-0000-0000-0000-000000000005', 'Dr. Ramesh Kumar', 'Placement Officer (TPO)')
ON CONFLICT DO NOTHING;

INSERT INTO contact_methods (id, contact_id, kind, value, provenance, verified_status, verified_at) VALUES
    ('e0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'email', 'sjenkins@acmeai.example.com', 'Official careers portal', 'deliverable', NOW() AT TIME ZONE 'UTC'),
    ('e0000002-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000002', 'email', 'marcus@betacloud.example.com', 'ContactOut lookup', 'deliverable', NOW() AT TIME ZONE 'UTC'),
    ('e0000003-0000-0000-0000-000000000003', 'c0000003-0000-0000-0000-000000000003', 'email', 'priya.s@gammadata.example.com', 'Snov.io lookup', 'catch_all', NOW() AT TIME ZONE 'UTC'),
    ('e0000005-0000-0000-0000-000000000005', 'c0000005-0000-0000-0000-000000000005', 'email', 'tpo@nei.example.edu', 'Institute public portal', 'deliverable', NOW() AT TIME ZONE 'UTC')
ON CONFLICT DO NOTHING;

-- 5. Insert Sample Opportunities
INSERT INTO opportunities (
    id, organization_id, type, title, description,
    experience_min, experience_max, salary_text, location,
    source_id, source_url, source_identifier, status, source_confidence
) VALUES
    ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'job',
     'Junior Python Developer (0-1 yrs)', 'Seeking enthusiastic Python junior engineers with FastAPI experience.',
     0, 1, '₹6,00,000 - ₹8,00,000 PA', 'Bengaluru, India',
     'internshala', 'https://internshala.com/job/detail/junior-python-001', 'int-job-001', 'verified', 95),

    ('b0000002-0000-0000-0000-000000000002', 'a0000002-0000-0000-0000-000000000002', 'internship',
     'Cloud Backend Intern', 'Join our core platform infrastructure team. Docker and Go/Python knowledge.',
     0, 0, '₹30,000 /month stipend', 'Remote',
     'internshala', 'https://internshala.com/internship/detail/cloud-intern-002', 'int-intern-002', 'draft_ready', 90),

    ('b0000003-0000-0000-0000-000000000003', 'a0000003-0000-0000-0000-000000000003', 'job',
     'Associate Data Analyst (0-2 yrs)', 'SQL, Python and data visualization for banking domain.',
     0, 2, 'Competitive', 'Mumbai, India',
     'naukri', 'https://naukri.com/job/detail/data-analyst-003', 'naukri-003', 'needs_enrichment', 75),

    ('b0000005-0000-0000-0000-000000000005', 'a0000005-0000-0000-0000-000000000005', 'college',
     '2026 Batch Campus Recruitment Drive', 'Annual campus placement invitation for Computer Science graduates.',
     0, 0, 'N/A', 'Pune, India',
     'college_tpo', 'https://colleges.example.edu/placements/2026', 'tpo-nei-2026', 'verified', 98)
ON CONFLICT (source_id, source_identifier) DO NOTHING;

-- Link Opportunity Contacts
INSERT INTO opportunity_contacts (opportunity_id, contact_id) VALUES
    ('b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001'),
    ('b0000002-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000002'),
    ('b0000003-0000-0000-0000-000000000003', 'c0000003-0000-0000-0000-000000000003'),
    ('b0000005-0000-0000-0000-000000000005', 'c0000005-0000-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

-- 6. Insert Data Quality Scores
INSERT INTO data_quality_scores (
    opportunity_id, score, band, reasons, factor_breakdown, scoring_version
) VALUES
    ('b0000001-0000-0000-0000-000000000001', 92, 'high',
     '[{"code": "OFFICIAL_COMPANY_SOURCE", "points": 25}, {"code": "CONTACT_ROLE_CONFIRMED", "points": 25}, {"code": "EMAIL_VERIFIED_DELIVERABLE", "points": 20}, {"code": "DATA_FRESH", "points": 12}, {"code": "COMPLETE_FIELDS", "points": 10}]'::jsonb,
     '{"source_reliability": 25, "org_contact_association": 25, "contact_verification": 20, "data_freshness": 12, "completeness": 10}'::jsonb, '1.0.0'),

    ('b0000002-0000-0000-0000-000000000002', 88, 'high',
     '[{"code": "OFFICIAL_COMPANY_SOURCE", "points": 23}, {"code": "CONTACT_ROLE_CONFIRMED", "points": 25}, {"code": "EMAIL_VERIFIED_DELIVERABLE", "points": 20}, {"code": "DATA_FRESH", "points": 10}, {"code": "COMPLETE_FIELDS", "points": 10}]'::jsonb,
     '{"source_reliability": 23, "org_contact_association": 25, "contact_verification": 20, "data_freshness": 10, "completeness": 10}'::jsonb, '1.0.0'),

    ('b0000003-0000-0000-0000-000000000003', 68, 'medium',
     '[{"code": "THIRD_PARTY_AGGREGATOR", "points": 18}, {"code": "CONTACT_UNVERIFIED", "points": 10}, {"code": "EMAIL_CATCH_ALL", "points": 10}, {"code": "DATA_FRESH", "points": 15}, {"code": "SALARY_MISSING", "points": 15}]'::jsonb,
     '{"source_reliability": 18, "org_contact_association": 10, "contact_verification": 10, "data_freshness": 15, "completeness": 15}'::jsonb, '1.0.0')
ON CONFLICT DO NOTHING;

-- 7. Insert Initial Campaign
INSERT INTO campaigns (id, name, purpose, status, daily_limit, created_by) VALUES
    ('d0000001-0000-0000-0000-000000000001', 'Q4 2026 Fresher Talent Outreach', 'Connecting verified technical freshers with tech startups and scaleups', 'active', 50, '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- 8. Insert Suppression Demo Entry
INSERT INTO suppression_entries (id, value, kind, reason, source, created_by) VALUES
    ('f0000001-0000-0000-0000-000000000001', 'blocked-company.example.com', 'domain', 'Organization requested no cold contact', 'manual', '11111111-1111-1111-1111-111111111111'),
    ('f0000002-0000-0000-0000-000000000002', 'optout@example.com', 'email', 'Recipient unsubscribed', 'unsubscribe', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

COMMIT;
