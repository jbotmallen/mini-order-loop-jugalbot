<?php

namespace App\Enums;

enum UserRole: string
{
    case Requester = 'requester';
    case Approver = 'approver';
}
