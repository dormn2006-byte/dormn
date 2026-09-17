import pool from '../config/db.js';
import crypto from 'crypto';

// Helper to determine if an event is completed
const checkEventCompleted = (eventDate, explicitStatus) => {
    if (explicitStatus === 'completed' || explicitStatus === 'ended') return true;
    if (!eventDate) return false;
    try {
        const datePart = eventDate.split('·')[0].split('-')[0].replace(/^[a-zA-Z]+,?\s+/, '').trim();
        const parsed = Date.parse(datePart);
        if (!isNaN(parsed)) {
            const endOfDay = new Date(parsed);
            endOfDay.setHours(23, 59, 59, 999);
            return Date.now() > endOfDay.getTime();
        }
    } catch {}
    return false;
};

export const createInvites = async (req, res) => {
    try {
        const {
            ticketCode, eventId, eventTitle, category = 'events',
            ticketType = 'couple', groupSize = 2, basePrice = 0, netAmount = 0,
            eventDate, eventLocation, eventImage, bookerPhone, bookerName
        } = req.body;

        const bookerUserId = req.user.id;
        const bookerEmail = req.user.email;

        // Fetch booker name & phone from DB if not provided
        let finalBookerName = bookerName;
        let finalBookerPhone = bookerPhone;
        const [userRows] = await pool.execute('SELECT full_name, phone FROM users WHERE id = ?', [bookerUserId]);
        if (userRows.length > 0) {
            finalBookerName = finalBookerName || userRows[0].full_name || 'Host';
            finalBookerPhone = finalBookerPhone || userRows[0].phone || '';
        }

        const parsedGroupSize = Math.max(2, Math.min(10, parseInt(groupSize) || 2));
        const finalSize = ticketType === 'couple' ? 2 : parsedGroupSize;
        const count = ticketType === 'couple' ? 1 : finalSize - 1;
        const invites = [];

        for (let i = 1; i <= count; i++) {
            const prefix = ticketType === 'couple' ? 'INV-CPL-' : 'INV-GRP-';
            const randomCode = crypto.randomBytes(3).toString('hex').toUpperCase();
            const inviteCode = `${prefix}${randomCode}`;

            await pool.execute(
                `INSERT INTO event_ticket_invites (
                    invite_code, ticket_code, event_id, event_title, category, ticket_type, 
                    booker_user_id, booker_name, booker_email, booker_phone, 
                    base_price, net_amount, event_date, event_location, event_image, group_size, slot_number,
                    status, expires_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL)`,
                [
                    inviteCode, ticketCode, eventId, eventTitle, category, ticketType, 
                    bookerUserId, finalBookerName, bookerEmail, finalBookerPhone, 
                    basePrice, netAmount, eventDate, eventLocation, eventImage, finalSize, i
                ]
            );

            invites.push({
                inviteCode,
                inviteLink: `/events/invite/${inviteCode}`,
                slotNumber: i,
                status: 'pending',
                slotLabel: ticketType === 'couple' ? 'Partner Pass' : `Member ${i + 1}`
            });
        }

        res.status(201).json({ success: true, ticketCode, ticketType, groupSize: finalSize, invites });
    } catch (error) {
        console.error('Error creating invites:', error);
        res.status(500).json({ success: false, message: 'Failed to create invites' });
    }
};

export const getInviteDetails = async (req, res) => {
    try {
        const { inviteCode } = req.params;

        const [rows] = await pool.execute(
            `SELECT * FROM event_ticket_invites WHERE invite_code = ?`,
            [inviteCode]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Invite not found' });
        }

        const invite = rows[0];
        const isCompleted = checkEventCompleted(invite.event_date, invite.status);

        const [allInviteRows] = await pool.execute(
            `SELECT id, invite_code, slot_number, invitee_name, invitee_email, invitee_phone, status, accepted_at 
             FROM event_ticket_invites WHERE ticket_code = ? ORDER BY slot_number ASC`,
            [invite.ticket_code]
        );

        const allMembers = [
            {
                name: invite.booker_name,
                email: invite.booker_email,
                phone: invite.booker_phone,
                status: 'confirmed',
                isOrganizer: true,
                slotNumber: 1,
                role: 'Primary Booker (Organizer)'
            },
            ...allInviteRows.map((row) => ({
                name: row.invitee_name || (invite.ticket_type === 'couple' ? 'Partner' : `Guest ${row.slot_number + 1}`),
                email: row.invitee_email,
                phone: row.invitee_phone,
                status: row.status,
                isOrganizer: false,
                inviteCode: row.invite_code,
                slotNumber: row.slot_number + 1,
                role: invite.ticket_type === 'couple' ? 'Partner' : `Member ${row.slot_number + 1}`,
                acceptedAt: row.accepted_at
            }))
        ];

        res.json({ success: true, invite, allMembers, isCompleted });
    } catch (error) {
        console.error('Error fetching invite details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch invite details' });
    }
};

export const acceptInvite = async (req, res) => {
    try {
        const { inviteCode, phone } = req.body;
        const inviteeUserId = req.user.id;
        const inviteeEmail = req.user.email;

        const [rows] = await pool.execute(
            `SELECT * FROM event_ticket_invites WHERE invite_code = ?`,
            [inviteCode]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Invite not found' });
        }

        const invite = rows[0];

        // Check if event is completed
        if (checkEventCompleted(invite.event_date, invite.status)) {
            return res.status(400).json({
                success: false,
                message: 'This event has completed. Pass invitations are closed once the event has ended.'
            });
        }

        if (invite.booker_user_id === inviteeUserId) {
            return res.status(400).json({
                success: false,
                message: 'You are the primary booker of this ticket! You already hold the organizer pass.'
            });
        }

        if (invite.status === 'accepted') {
            if (invite.invitee_user_id === inviteeUserId) {
                const [allMembers] = await pool.execute(
                    `SELECT invitee_name, status, slot_number FROM event_ticket_invites WHERE ticket_code = ?`,
                    [invite.ticket_code]
                );
                return res.json({ success: true, message: 'You have already accepted this pass', invite, allMembers, isCompleted: false });
            }
            return res.status(400).json({ success: false, message: 'This pass has already been accepted by another guest' });
        }

        let inviteeName = req.body.name;
        let inviteePhone = phone;
        const [userRows] = await pool.execute('SELECT full_name, phone FROM users WHERE id = ?', [inviteeUserId]);
        if (userRows.length > 0) {
            inviteeName = inviteeName || userRows[0].full_name || 'Guest';
            inviteePhone = inviteePhone || userRows[0].phone || '';
        }

        await pool.execute(
            `UPDATE event_ticket_invites 
             SET invitee_user_id = ?, invitee_name = ?, invitee_email = ?, invitee_phone = ?, status = 'accepted', accepted_at = NOW() 
             WHERE invite_code = ?`,
            [inviteeUserId, inviteeName, inviteeEmail, inviteePhone, inviteCode]
        );

        const [updatedRows] = await pool.execute(
            `SELECT * FROM event_ticket_invites WHERE invite_code = ?`,
            [inviteCode]
        );

        const updatedInvite = updatedRows[0];

        const [allInviteRows] = await pool.execute(
            `SELECT id, slot_number, invitee_name, status FROM event_ticket_invites WHERE ticket_code = ?`,
            [updatedInvite.ticket_code]
        );

        const allMembers = [
            { name: updatedInvite.booker_name, status: 'confirmed', isOrganizer: true },
            ...allInviteRows.map(r => ({ name: r.invitee_name || 'Pending', status: r.status, isOrganizer: false }))
        ];

        res.json({
            success: true,
            message: 'Invite accepted successfully!',
            invite: updatedInvite,
            allMembers,
            isCompleted: false
        });
    } catch (error) {
        console.error('Error accepting invite:', error);
        res.status(500).json({ success: false, message: 'Failed to accept invite' });
    }
};

export const getMyInvites = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.execute(
            `SELECT * FROM event_ticket_invites WHERE booker_user_id = ? OR invitee_user_id = ? ORDER BY created_at DESC`,
            [userId, userId]
        );

        res.json({
            success: true,
            sent: rows.filter(row => row.booker_user_id === userId),
            received: rows.filter(row => row.invitee_user_id === userId)
        });
    } catch (error) {
        console.error('Error fetching my invites:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch your invites' });
    }
};
