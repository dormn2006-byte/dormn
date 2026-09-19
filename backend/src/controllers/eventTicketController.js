import crypto from 'crypto';
import EventTicketInvite from '../schemas/eventTicketInviteSchema.js';
import User from '../schemas/userSchema.js';
import { serialize } from '../utils/serialize.js';

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

// Invites expire once the event day is over; fall back to a 30-day window when
// the (human-formatted) event date cannot be parsed.
const computeExpiresAt = (eventDate) => {
    if (eventDate) {
        try {
            const datePart = String(eventDate).split('·')[0].split('-')[0].replace(/^[a-zA-Z]+,?\s+/, '').trim();
            const parsed = Date.parse(datePart);
            if (!isNaN(parsed)) {
                const endOfDay = new Date(parsed);
                endOfDay.setHours(23, 59, 59, 999);
                return endOfDay;
            }
        } catch {}
    }
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
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
        const userRow = await User.findById(Number(bookerUserId)).lean();
        if (userRow) {
            finalBookerName = finalBookerName || userRow.full_name || 'Host';
            finalBookerPhone = finalBookerPhone || userRow.phone || '';
        }

        const parsedGroupSize = Math.max(2, Math.min(10, parseInt(groupSize) || 2));
        const finalSize = ticketType === 'couple' ? 2 : parsedGroupSize;
        const count = ticketType === 'couple' ? 1 : finalSize - 1;
        const invites = [];

        for (let i = 1; i <= count; i++) {
            const prefix = ticketType === 'couple' ? 'INV-CPL-' : 'INV-GRP-';
            const randomCode = crypto.randomBytes(3).toString('hex').toUpperCase();
            const inviteCode = `${prefix}${randomCode}`;

            await EventTicketInvite.create({
                invite_code: inviteCode,
                ticket_code: ticketCode,
                event_id: eventId,
                event_title: eventTitle,
                category,
                ticket_type: ticketType,
                booker_user_id: bookerUserId,
                booker_name: finalBookerName,
                booker_email: bookerEmail,
                booker_phone: finalBookerPhone,
                base_price: basePrice,
                net_amount: netAmount,
                event_date: eventDate,
                event_location: eventLocation,
                event_image: eventImage,
                group_size: finalSize,
                slot_number: i,
                status: 'pending',
                accepted_at: null,
                expires_at: computeExpiresAt(eventDate),
            });

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

        const invite = await EventTicketInvite.findOne({ invite_code: inviteCode }).lean();

        if (!invite) {
            return res.status(404).json({ success: false, message: 'Invite not found' });
        }

        const isCompleted = checkEventCompleted(invite.event_date, invite.status);

        const allInviteRows = await EventTicketInvite.find({ ticket_code: invite.ticket_code })
            .select('_id invite_code slot_number invitee_name invitee_email invitee_phone status accepted_at')
            .sort({ slot_number: 1 })
            .lean();

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

        res.json({ success: true, invite: serialize(invite), allMembers, isCompleted });
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

        const invite = await EventTicketInvite.findOne({ invite_code: inviteCode }).lean();

        if (!invite) {
            return res.status(404).json({ success: false, message: 'Invite not found' });
        }

        // Check if event is completed
        if (checkEventCompleted(invite.event_date, invite.status)) {
            return res.status(400).json({
                success: false,
                message: 'This event has completed. Pass invitations are closed once the event has ended.'
            });
        }

        if (Number(invite.booker_user_id) === Number(inviteeUserId)) {
            return res.status(400).json({
                success: false,
                message: 'You are the primary booker of this ticket! You already hold the organizer pass.'
            });
        }

        if (invite.status === 'accepted') {
            if (Number(invite.invitee_user_id) === Number(inviteeUserId)) {
                const allMembers = await EventTicketInvite.find({ ticket_code: invite.ticket_code })
                    .select('invitee_name status slot_number')
                    .lean();
                return res.json({ success: true, message: 'You have already accepted this pass', invite: serialize(invite), allMembers, isCompleted: false });
            }
            return res.status(400).json({ success: false, message: 'This pass has already been accepted by another guest' });
        }

        let inviteeName = req.body.name;
        let inviteePhone = phone;
        const userRow = await User.findById(Number(inviteeUserId)).lean();
        if (userRow) {
            inviteeName = inviteeName || userRow.full_name || 'Guest';
            inviteePhone = inviteePhone || userRow.phone || '';
        }

        await EventTicketInvite.updateOne(
            { invite_code: inviteCode },
            {
                invitee_user_id: Number(inviteeUserId),
                invitee_name: inviteeName,
                invitee_email: inviteeEmail,
                invitee_phone: inviteePhone,
                status: 'accepted',
                accepted_at: new Date()
            }
        );

        const updatedInvite = await EventTicketInvite.findOne({ invite_code: inviteCode }).lean();

        const allInviteRows = await EventTicketInvite.find({ ticket_code: updatedInvite.ticket_code })
            .select('_id slot_number invitee_name status')
            .lean();

        const allMembers = [
            { name: updatedInvite.booker_name, status: 'confirmed', isOrganizer: true },
            ...allInviteRows.map(r => ({ name: r.invitee_name || 'Pending', status: r.status, isOrganizer: false }))
        ];

        res.json({
            success: true,
            message: 'Invite accepted successfully!',
            invite: serialize(updatedInvite),
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
        const rows = await EventTicketInvite.find({
            $or: [{ booker_user_id: Number(userId) }, { invitee_user_id: Number(userId) }]
        })
            .sort({ created_at: -1 })
            .lean();

        const all = serialize(rows);

        res.json({
            success: true,
            sent: all.filter(row => Number(row.booker_user_id) === Number(userId)),
            received: all.filter(row => Number(row.invitee_user_id) === Number(userId))
        });
    } catch (error) {
        console.error('Error fetching my invites:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch your invites' });
    }
};
