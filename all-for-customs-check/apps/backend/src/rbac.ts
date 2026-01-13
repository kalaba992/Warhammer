// RBAC-protected API endpoints (initial scaffold)
import { Router } from 'express';

const router = Router();

const roles = {
  admin: ['read', 'write', 'delete'],
  reviewer: ['read', 'write'],
  user: ['read'],
};

function checkRole(role: keyof typeof roles, action: string) {
  return roles[role]?.includes(action);
}

router.get('/api/admin', (req, res) => {
  // TODO: Extract user role from auth middleware
  const role = 'admin';
  if (!checkRole(role, 'read')) return res.status(403).json({ error: 'Forbidden' });
  res.json({ data: 'Admin data' });
});

router.get('/api/reviewer', (req, res) => {
  const role = 'reviewer';
  if (!checkRole(role, 'read')) return res.status(403).json({ error: 'Forbidden' });
  res.json({ data: 'Reviewer data' });
});

router.get('/api/user', (req, res) => {
  const role = 'user';
  if (!checkRole(role, 'read')) return res.status(403).json({ error: 'Forbidden' });
  res.json({ data: 'User data' });
});

export default router;
