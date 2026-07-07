import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

export const products = sqliteTable('products', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	price: real('price').notNull(),
	description: text('description'),
	quantity: integer('quantity').notNull().default(0),
	hero: text('hero'), // URL of the primary/thumbnail image
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const productImages = sqliteTable('product_images', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	productId: integer('product_id')
		.references(() => products.id, { onDelete: 'cascade' })
		.notNull(),
	url: text('url').notNull(),
	sortOrder: integer('sort_order').default(0)
});

export const adminSessions = sqliteTable('admin_sessions', {
	id: text('id').primaryKey(),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export type Product = typeof products.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
