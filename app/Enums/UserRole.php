<?php

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case AdminVendor = 'admin_vendor';
    case ProjectManager = 'project_manager';
    case Team = 'team';
    case Client = 'client';
    case SubVendor = 'sub_vendor';
}
