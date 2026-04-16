import { NextResponse } from 'next/server';

/**
 * GVTEWAY REST API v1
 *
 * OpenAPI 3.1 specification (auto-generated from route handlers)
 * Swagger UI served at /api/v1/docs
 *
 * Authentication: Bearer token (Supabase service role or user JWT)
 *
 * Resources:
 * - /api/v1/projects         GET, POST
 * - /api/v1/projects/:id     GET, PATCH, DELETE
 * - /api/v1/catalog/groups   GET
 * - /api/v1/catalog/items    GET, POST
 * - /api/v1/catalog/items/:id  GET, PATCH, DELETE
 * - /api/v1/deliverables     GET, POST
 * - /api/v1/deliverables/:id GET, PATCH
 * - /api/v1/allocations      GET, POST
 * - /api/v1/allocations/:id  PATCH
 * - /api/v1/catering/meals   GET, POST
 * - /api/v1/notifications    POST
 * - /api/v1/webhooks         POST (register), DELETE (unregister)
 */

const OPENAPI_SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'GVTEWAY API',
    version: '1.0.0',
    description: 'Universal Production Advancing REST API. One catalog, two views. Enterprise-grade production advancing for live events.',
    contact: { email: 'api@gvteway.com' },
  },
  servers: [
    { url: '/api/v1', description: 'Current environment' },
  ],
  paths: {
    '/projects': {
      get: {
        summary: 'List projects',
        tags: ['Projects'],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'active', 'completed', 'archived'] } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['talent_advance', 'production_advance', 'hybrid'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: { '200': { description: 'Project list' } },
      },
      post: {
        summary: 'Create project',
        tags: ['Projects'],
        requestBody: { content: { 'application/json': { schema: { '$ref': '#/components/schemas/ProjectCreate' } } } },
        responses: { '201': { description: 'Project created' } },
      },
    },
    '/projects/{id}': {
      get: { summary: 'Get project', tags: ['Projects'], responses: { '200': { description: 'Project detail' } } },
      patch: { summary: 'Update project', tags: ['Projects'], responses: { '200': { description: 'Project updated' } } },
      delete: { summary: 'Archive project', tags: ['Projects'], responses: { '204': { description: 'Project archived' } } },
    },
    '/catalog/groups': {
      get: { summary: 'List catalog groups', tags: ['Catalog'], responses: { '200': { description: 'Category group list with nested categories and subcategories' } } },
    },
    '/catalog/items': {
      get: {
        summary: 'List catalog items',
        tags: ['Catalog'],
        parameters: [
          { name: 'group', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'subcategory', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'visibility', in: 'query', schema: { type: 'string', enum: ['production', 'talent_facing'] } },
          { name: 'manufacturer', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Item list (role-filtered by RLS)' } },
      },
      post: { summary: 'Create catalog item', tags: ['Catalog'], responses: { '201': { description: 'Item created' } } },
    },
    '/catalog/items/{id}': {
      get: { summary: 'Get catalog item with intelligence', tags: ['Catalog'], responses: { '200': { description: 'Item with interchange, supersession, fitment' } } },
      patch: { summary: 'Update catalog item', tags: ['Catalog'], responses: { '200': { description: 'Item updated' } } },
    },
    '/deliverables': {
      get: {
        summary: 'List deliverables',
        tags: ['Deliverables'],
        parameters: [
          { name: 'project_id', in: 'query', schema: { type: 'string', format: 'uuid' }, required: true },
          { name: 'type', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Deliverable list' } },
      },
      post: {
        summary: 'Create deliverable',
        tags: ['Deliverables'],
        responses: { '201': { description: 'Deliverable created (draft)' } },
      },
    },
    '/deliverables/{id}': {
      get: { summary: 'Get deliverable with comments/history', tags: ['Deliverables'], responses: { '200': { description: 'Deliverable detail' } } },
      patch: { summary: 'Update deliverable (submit, approve, reject)', tags: ['Deliverables'], responses: { '200': { description: 'Deliverable updated' } } },
    },
    '/allocations': {
      get: {
        summary: 'List allocations',
        tags: ['Allocations'],
        parameters: [
          { name: 'project_id', in: 'query', schema: { type: 'string', format: 'uuid' }, required: true },
          { name: 'state', in: 'query', schema: { type: 'string', enum: ['reserved', 'confirmed', 'in_transit', 'on_site', 'returned', 'maintenance'] } },
        ],
        responses: { '200': { description: 'Allocation list' } },
      },
      post: { summary: 'Create allocation', tags: ['Allocations'], responses: { '201': { description: 'Allocation created (reserved)' } } },
    },
    '/allocations/{id}': {
      patch: { summary: 'Transition allocation state', tags: ['Allocations'], responses: { '200': { description: 'State transitioned (validated by DB trigger)' } } },
    },
    '/catering/meals': {
      get: { summary: 'List meal plans', tags: ['Catering'], responses: { '200': { description: 'Meal plan list with allocations' } } },
      post: { summary: 'Create meal plan', tags: ['Catering'], responses: { '201': { description: 'Meal plan created' } } },
    },
    '/notifications': {
      post: { summary: 'Send notification', tags: ['Notifications'], responses: { '200': { description: 'Notification queued' } } },
    },
    '/webhooks': {
      post: { summary: 'Register webhook endpoint', tags: ['Webhooks'], responses: { '201': { description: 'Webhook registered' } } },
    },
  },
  components: {
    schemas: {
      ProjectCreate: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          slug: { type: 'string' },
          type: { type: 'string', enum: ['talent_advance', 'production_advance', 'hybrid'] },
          start_date: { type: 'string', format: 'date' },
          end_date: { type: 'string', format: 'date' },
          venue: { type: 'object' },
          features: { type: 'array', items: { type: 'string' } },
        },
        required: ['name', 'slug', 'type'],
      },
    },
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      apiKey: { type: 'apiKey', in: 'header', name: 'apikey' },
    },
  },
  security: [{ bearerAuth: [] }, { apiKey: [] }],
};

export async function GET() {
  return NextResponse.json(OPENAPI_SPEC);
}
