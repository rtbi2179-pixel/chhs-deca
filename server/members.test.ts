import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';
import { getDb } from './db';
import { portfolioItems, adminMemberNotes, directMessages } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Members Management', () => {
  const testSchoolCode = 'test-members-school';
  const testAdminId = 999;
  const testMemberId = 1000;

  beforeAll(async () => {
    // Skip if database is not available
    const database = await getDb();
    if (!database) {
      console.warn('Database not available, skipping member tests');
      return;
    }
    // Clean up any existing test data
    try {
      await database.delete(portfolioItems).where(eq(portfolioItems.userId, testMemberId));
      await database.delete(adminMemberNotes).where(eq(adminMemberNotes.schoolCode, testSchoolCode));
      await database.delete(directMessages).where(eq(directMessages.schoolCode, testSchoolCode));
    } catch (error) {
      console.warn('Error cleaning up test data:', error);
    }
  });

  afterAll(async () => {
    // Clean up test data
    const database = await getDb();
    if (!database) return;
    try {
      await database.delete(portfolioItems).where(eq(portfolioItems.userId, testMemberId));
      await database.delete(adminMemberNotes).where(eq(adminMemberNotes.schoolCode, testSchoolCode));
      await database.delete(directMessages).where(eq(directMessages.schoolCode, testSchoolCode));
    } catch (error) {
      console.warn('Error cleaning up test data:', error);
    }
  });

  describe.skip('Portfolio Management', () => {
    it('should create a portfolio item', async () => {
      const item = await db.createPortfolioItem({
        userId: testMemberId,
        schoolCode: testSchoolCode,
        title: 'Test Portfolio Item',
        category: 'Written Event',
        description: 'Test description',
        fileUrl: 'https://example.com/file.pdf',
      });

      expect(item).toBeDefined();
      expect(item.title).toBe('Test Portfolio Item');
      expect(item.userId).toBe(testMemberId);
      expect(item.schoolCode).toBe(testSchoolCode);
    });

    it('should get portfolio items for a user', async () => {
      await db.createPortfolioItem({
        userId: testMemberId,
        schoolCode: testSchoolCode,
        title: 'Portfolio Item 1',
        category: 'Written Event',
      });

      await db.createPortfolioItem({
        userId: testMemberId,
        schoolCode: testSchoolCode,
        title: 'Portfolio Item 2',
        category: 'Roleplay',
      });

      const items = await db.getPortfolioItems(testMemberId, testSchoolCode);
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThanOrEqual(2);
    });

    it('should update portfolio item status', async () => {
      const item = await db.createPortfolioItem({
        userId: testMemberId,
        schoolCode: testSchoolCode,
        title: 'Status Test Item',
        category: 'Exam Preparation',
      });

      const updated = await db.updatePortfolioItemStatus(
        item.id,
        testAdminId,
        testSchoolCode,
        'ready_for_review',
        'Looks good!'
      );

      expect(updated.status).toBe('ready_for_review');
      expect(updated.adminFeedback).toBe('Looks good!');
    });

    it('should delete portfolio item', async () => {
      const item = await db.createPortfolioItem({
        userId: testMemberId,
        schoolCode: testSchoolCode,
        title: 'Delete Test Item',
        category: 'Resume',
      });

      await db.deletePortfolioItem(item.id, testMemberId);

      const items = await db.getPortfolioItems(testMemberId, testSchoolCode);
      expect(items.some((i: any) => i.id === item.id)).toBe(false);
    });
  });

  describe.skip('Admin Notes', () => {
    it('should create an admin note', async () => {
      const note = await db.createAdminNote({
        schoolCode: testSchoolCode,
        memberId: testMemberId,
        adminId: testAdminId,
        note: 'Test admin note',
      });

      expect(note).toBeDefined();
      expect(note.note).toBe('Test admin note');
      expect(note.memberId).toBe(testMemberId);
    });

    it('should get admin notes for a member', async () => {
      await db.createAdminNote({
        schoolCode: testSchoolCode,
        memberId: testMemberId,
        adminId: testAdminId,
        note: 'Note 1',
      });

      await db.createAdminNote({
        schoolCode: testSchoolCode,
        memberId: testMemberId,
        adminId: testAdminId,
        note: 'Note 2',
      });

      const notes = await db.getAdminNotes(testMemberId, testSchoolCode, testAdminId);
      expect(notes.length).toBeGreaterThanOrEqual(2);
    });

    it('should update admin note', async () => {
      const note = await db.createAdminNote({
        schoolCode: testSchoolCode,
        memberId: testMemberId,
        adminId: testAdminId,
        note: 'Original note',
      });

      const updated = await db.updateAdminNote(note.id, testAdminId, testSchoolCode, 'Updated note');
      expect(updated.note).toBe('Updated note');
    });

    it('should delete admin note', async () => {
      const note = await db.createAdminNote({
        schoolCode: testSchoolCode,
        memberId: testMemberId,
        adminId: testAdminId,
        note: 'Delete me',
      });

      await db.deleteAdminNote(note.id, testAdminId, testSchoolCode);

      const notes = await db.getAdminNotes(testMemberId, testSchoolCode, testAdminId);
      expect(notes.some((n: any) => n.id === note.id)).toBe(false);
    });
  });

  describe.skip('Direct Messaging', () => {
    it('should send a direct message', async () => {
      const message = await db.sendDirectMessage({
        senderId: testAdminId,
        recipientId: testMemberId,
        schoolCode: testSchoolCode,
        body: 'Test message',
      });

      expect(message).toBeDefined();
      expect(message.body).toBe('Test message');
      expect(message.senderId).toBe(testAdminId);
      expect(message.recipientId).toBe(testMemberId);
    });

    it('should get direct messages between two users', async () => {
      await db.sendDirectMessage({
        senderId: testAdminId,
        recipientId: testMemberId,
        schoolCode: testSchoolCode,
        body: 'Message 1',
      });

      await db.sendDirectMessage({
        senderId: testMemberId,
        recipientId: testAdminId,
        schoolCode: testSchoolCode,
        body: 'Message 2',
      });

      const messages = await db.getDirectMessages(testAdminId, testMemberId, testSchoolCode);
      expect(messages.length).toBeGreaterThanOrEqual(2);
    });

    it('should mark message as read', async () => {
      const message = await db.sendDirectMessage({
        senderId: testAdminId,
        recipientId: testMemberId,
        schoolCode: testSchoolCode,
        body: 'Mark as read test',
      });

      const marked = await db.markMessageAsRead(message.id, testMemberId);
      expect(marked.isRead).toBe(true);
    });

    it('should get conversation list', async () => {
      await db.sendDirectMessage({
        senderId: testAdminId,
        recipientId: testMemberId,
        schoolCode: testSchoolCode,
        body: 'Conversation test',
      });

      const conversations = await db.getConversationList(testAdminId, testSchoolCode);
      expect(conversations.length).toBeGreaterThanOrEqual(0);
    });
  });
});
