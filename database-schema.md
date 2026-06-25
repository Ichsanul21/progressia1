# Progressia — Database Schema

## vendors
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| name | varchar(255) | NOT NULL |
| slug | varchar(255) | UNIQUE, NOT NULL |
| logo | varchar(255) | NULLABLE |
| address | text | NULLABLE |
| phone | varchar(50) | NULLABLE |
| email | varchar(255) | NULLABLE |
| timezone | varchar(50) | DEFAULT 'Asia/Jakarta' |
| default_lang | varchar(10) | DEFAULT 'id' |
| is_active | boolean | DEFAULT true |
| timestamps | | |
| soft_deleted_at | timestamp | NULLABLE |

## sub_vendors
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| vendor_id | bigint unsigned | FK -> vendors.id, NOT NULL |
| name | varchar(255) | NOT NULL |
| slug | varchar(255) | UNIQUE, NOT NULL |
| description | text | NULLABLE |
| tags | json | NULLABLE |
| is_active | boolean | DEFAULT true |
| timestamps | | |
| soft_deleted_at | timestamp | NULLABLE |

Index: (vendor_id)

## users
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| vendor_id | bigint unsigned | FK -> vendors.id, NULLABLE |
| name | varchar(255) | NOT NULL |
| email | varchar(255) | UNIQUE, NOT NULL |
| password | varchar(255) | NOT NULL |
| role | varchar(255) | DEFAULT 'team' |
| two_factor_secret | text | NULLABLE |
| two_factor_recovery_codes | text | NULLABLE |
| two_factor_confirmed_at | timestamp | NULLABLE |
| email_verified_at | timestamp | NULLABLE |
| remember_token | varchar(100) | NULLABLE |
| timestamps | | |

Index: (vendor_id), (role)

## passkeys
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| user_id | bigint unsigned | FK -> users.id, NOT NULL |
| name | varchar(255) | NOT NULL |
| credential_id | varchar(255) | UNIQUE, NOT NULL |
| credential | json | NOT NULL |
| last_used_at | timestamp | NULLABLE |
| timestamps | | |

Index: (user_id)

## invitations
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| vendor_id | bigint unsigned | FK -> vendors.id, NOT NULL |
| email | varchar(255) | NOT NULL |
| role | varchar(255) | NOT NULL |
| token | varchar(64) | UNIQUE, NOT NULL |
| invited_by | bigint unsigned | FK -> users.id, NOT NULL |
| expires_at | timestamp | NOT NULL |
| accepted_at | timestamp | NULLABLE |
| cancelled_at | timestamp | NULLABLE |
| timestamps | | |

## project_user (pivot — team members)
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| project_id | bigint unsigned | FK -> projects.id, NOT NULL |
| user_id | bigint unsigned | FK -> users.id, NOT NULL |
| role | varchar(255) | DEFAULT 'member' |
| created_at | timestamp | |
| updated_at | timestamp | |
| UNIQUE | (project_id, user_id) | |

## project_client (pivot)
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| project_id | bigint unsigned | FK -> projects.id, NOT NULL |
| user_id | bigint unsigned | FK -> users.id, NOT NULL |
| created_at | timestamp | |
| UNIQUE | (project_id, user_id) | |

## favorites
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| project_id | bigint unsigned | FK -> projects.id, NOT NULL |
| user_id | bigint unsigned | FK -> users.id, NOT NULL |
| created_at | timestamp | |
| updated_at | timestamp | |
| UNIQUE | (project_id, user_id) | |

## documents
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| project_id | bigint unsigned | FK -> projects.id, NOT NULL |
| vendor_id | bigint unsigned | FK -> vendors.id, NOT NULL |
| name | varchar(255) | NOT NULL |
| file_path | varchar(255) | NOT NULL |
| file_size | bigint | NULLABLE (bytes) |
| mime_type | varchar(255) | NULLABLE |
| category | varchar(255) | DEFAULT 'other' |
| version | integer | DEFAULT 1 |
| uploaded_by | bigint unsigned | FK -> users.id, NOT NULL |
| timestamps | | |

Index: (project_id), (category)

## reviews
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| task_id | bigint unsigned | FK -> tasks.id, NOT NULL |
| requested_by | bigint unsigned | FK -> users.id, NOT NULL |
| approved_by | bigint unsigned | FK -> users.id, NULLABLE |
| status | enum('pending','approved','rejected') | DEFAULT 'pending' |
| reason | text | NULLABLE — rejection reason |
| auto_approved | boolean | DEFAULT false |
| timestamps | | |

Index: (task_id), (status)

## activity_logs
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| subject_type | varchar(255) | NOT NULL — morphs |
| subject_id | bigint unsigned | NOT NULL |
| user_id | bigint unsigned | FK -> users.id, NULLABLE |
| vendor_id | bigint unsigned | NULLABLE, indexed |
| event | varchar(255) | NOT NULL |
| old_values | json | NULLABLE |
| new_values | json | NULLABLE |
| description | text | NULLABLE |
| ip_address | varchar(45) | NULLABLE |
| user_agent | text | NULLABLE |
| created_at | timestamp | |
| updated_at | timestamp | |

Index: (subject_type, subject_id), (vendor_id), (event)

## phases
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| project_id | bigint unsigned | FK -> projects.id, NOT NULL |
| name | varchar(255) | NOT NULL |
| description | text | NULLABLE |
| status | varchar(255) | DEFAULT 'not_started' |
| progress | integer | DEFAULT 0 |
| sort_order | integer | DEFAULT 0 |
| vendor_id | bigint unsigned | NULLABLE, indexed |
| timestamps | | |

Index: (project_id), (vendor_id)

## projects
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| vendor_id | bigint unsigned | FK -> vendors.id, NOT NULL |
| sub_vendor_id | bigint unsigned | FK -> sub_vendors.id, NULLABLE |
| name | varchar(255) | NOT NULL |
| description | text | NULLABLE |
| categories | json | NULLABLE |
| tags | json | NULLABLE |
| status | varchar(255) | DEFAULT 'not_started' |
| progress | integer | DEFAULT 0 — cached, 0-100 |
| start_date | date | NULLABLE |
| target_date | date | NULLABLE |
| budget | decimal(15,2) | NULLABLE |
| review_mode | boolean | DEFAULT false |
| cover_image | varchar(255) | NULLABLE |
| is_template | boolean | DEFAULT false |
| duplicated_from | bigint unsigned | FK -> projects.id, NULLABLE |
| archived_at | timestamp | NULLABLE |
| created_by | bigint unsigned | FK -> users.id, NULLABLE |
| timestamps | | |
| soft_deleted_at | timestamp | NULLABLE |

Index: (vendor_id), (sub_vendor_id), (status), (created_by)

## tasks
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| project_id | bigint unsigned | FK -> projects.id, NOT NULL |
| phase_id | bigint unsigned | FK -> phases.id, NULLABLE |
| vendor_id | bigint unsigned | NULLABLE, indexed |
| assigned_to | bigint unsigned | FK -> users.id, NULLABLE |
| name | varchar(255) | NOT NULL |
| description | text | NULLABLE |
| status | varchar(255) | DEFAULT 'not_started' |
| priority | varchar(255) | DEFAULT 'medium' |
| start_date | date | NULLABLE |
| due_date | date | NULLABLE |
| progress | integer | DEFAULT 0 — cached, 0-100 |
| sort_order | integer | DEFAULT 0 |
| created_by | bigint unsigned | FK -> users.id, NULLABLE |
| updated_by | bigint unsigned | FK -> users.id, NULLABLE — last editor |
| timestamps | | |
| soft_deleted_at | timestamp | NULLABLE |

Index: (project_id), (vendor_id), (assigned_to), (status)

## sub_tasks
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| task_id | bigint unsigned | FK -> tasks.id, NOT NULL |
| parent_id | bigint unsigned | FK -> sub_tasks.id, NULLABLE — for nesting |
| vendor_id | bigint unsigned | NULLABLE, indexed |
| name | varchar(255) | NOT NULL |
| description | text | NULLABLE |
| status | varchar(255) | DEFAULT 'not_started' — enum: not_started, in_progress, review, done, revisi |
| assigned_to | bigint unsigned | FK -> users.id, NULLABLE |
| sort_order | integer | DEFAULT 0 |
| timestamps | | |

Index: (task_id), (parent_id), (vendor_id)

Sub-task status enum: `not_started | in_progress | review | done | revisi`. Progress mapping: not_started/revisi=0, in_progress=25, review=50, done=100. Parent sub-task progress = AVG of children.

## expenses
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| project_id | bigint unsigned | FK -> projects.id, NOT NULL |
| category | enum('material','labor','transport','permit','other') | NOT NULL |
| description | text | NULLABLE |
| amount | decimal(15,2) | NOT NULL |
| incurred_date | date | NOT NULL |
| created_by | bigint unsigned | FK -> users.id, NOT NULL |
| timestamps | | |

Index: (project_id), (category)

## time_logs
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| task_id | bigint unsigned | FK -> tasks.id, NOT NULL |
| user_id | bigint unsigned | FK -> users.id, NOT NULL |
| started_at | datetime | NOT NULL |
| ended_at | datetime | NULLABLE |
| duration_minutes | integer | NULLABLE — calculated on stop |
| note | text | NULLABLE |
| timestamps | | |

Index: (task_id), (user_id), (started_at)

## plans
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| name | varchar(255) | NOT NULL |
| slug | varchar(255) | UNIQUE, NOT NULL |
| max_projects | integer | NOT NULL — 0 = unlimited |
| max_team_members | integer | NOT NULL |
| max_storage_mb | integer | NOT NULL |
| max_sub_vendors | integer | DEFAULT 0 |
| price | decimal(15,2) | NOT NULL |
| duration_days | integer | DEFAULT 30 |
| is_active | boolean | DEFAULT true |
| timestamps | | |

## subscriptions
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| vendor_id | bigint unsigned | FK -> vendors.id, NOT NULL |
| plan_id | bigint unsigned | FK -> plans.id, NOT NULL |
| start_date | date | NOT NULL |
| end_date | date | NOT NULL |
| trial_ends_at | date | NULLABLE |
| status | enum('active','trialing','cancelled','expired') | DEFAULT 'trialing' |
| cancelled_at | timestamp | NULLABLE |
| timestamps | | |

Index: (vendor_id), (status)

## sub_task_updates
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| sub_task_id | bigint unsigned | FK -> sub_tasks.id, NOT NULL |
| user_id | bigint unsigned | FK -> users.id, NOT NULL |
| completed_qty | decimal(15,2) | NOT NULL |
| note | text | NULLABLE |
| location_lat | decimal(10,7) | NULLABLE |
| location_lng | decimal(10,7) | NULLABLE |
| location_name | varchar(255) | NULLABLE |
| timestamps | | |

Index: (sub_task_id), (user_id)

## sub_task_photos
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| sub_task_update_id | bigint unsigned | FK -> sub_task_updates.id, NOT NULL |
| filename | varchar(255) | NOT NULL |
| original_name | varchar(255) | NOT NULL |
| file_path | varchar(255) | NOT NULL |
| mime_type | varchar(100) | NULLABLE |
| file_size | bigint | NULLABLE (bytes) |
| created_at | timestamp | |

Index: (sub_task_update_id)

## notifications
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint unsigned | PK, auto_increment |
| user_id | bigint unsigned | FK -> users.id, NOT NULL |
| type | varchar(255) | NOT NULL |
| title | varchar(255) | NOT NULL |
| body | text | NULLABLE |
| data | json | NULLABLE |
| is_read | boolean | DEFAULT false |
| created_at | timestamp | |
| updated_at | timestamp | |

Index: (user_id, is_read)

## Soft Deletes

Tables using `soft_deletes` / `soft_deleted_at`:

| Table | Column | Notes |
|-------|--------|-------|
| vendors | soft_deleted_at | |
| sub_vendors | soft_deleted_at | |
| projects | soft_deleted_at | |
| tasks | soft_deleted_at | |
| documents | soft_deleted_at | Column exists in schema; migration for this column is not present in migration files |

## Progress Calculation Logic

```
Sub-task (leaf):
  ↓ status -> progress % (not_started/revisi=0, in_progress=25, review=50, done=100)

Sub-task (parent):
  ↓ AVG(child sub-task progress)

Task progress:
  ↓ AVG(top-level sub-task progress)

Project progress:
  ↓ AVG(all task progress)

Task status enum: not_started | in_progress | review | done | revisi.
Transition rules (non-admin strict):
  - not_started -> in_progress
  - in_progress -> review
  - review -> done | revisi
  - revisi -> review
  - done -> terminal
Admin can do any transition.

## Task Timeline Endpoint

`GET /projects/{p}/tasks/{t}/timeline?type=all|activity|progress&q=&offset=`

Returns JSON:
```json
{
  "entries": [...],
  "has_more": false,
  "total": 0,
  "offset": 0
}
```

Each entry is one of:
- Activity log: `{ id, type: "activity", event, description, user, created_at, old_values, new_values, photos: [] }`
- Progress update (task or sub-task): `{ id, type: "progress", subject: "task"|"sub_task", subject_id, subject_name, description, user, created_at, photos: [...] }`

Limit: 50 entries per request. No hard max — client paginates via `offset` and stops when `has_more=false`. Search matches `description LIKE %q%` on activity and progress entries.
```
