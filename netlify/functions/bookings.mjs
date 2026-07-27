import { randomUUID } from 'node:crypto';
import { Resend } from 'resend';
import { packages } from '../../src/data/packages.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s\-()]{7,17}$/;

const json = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });

const clean = (value, maximum) =>
  typeof value === 'string' ? value.trim().slice(0, maximum) : '';

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const createBookingReference = () => {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const code = randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();

  return `CDS-${date}-${code}`;
};

export default async function handler(request) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json({ error: 'Invalid content type.' }, 415);
  }

  if (
    !process.env.RESEND_API_KEY ||
    !process.env.OWNER_EMAIL ||
    !process.env.BOOKING_FROM_EMAIL
  ) {
    console.error('Booking email environment variables are missing.');
    return json({ error: 'Booking service is temporarily unavailable.' }, 500);
  }

  try {
    const body = await request.json();

    /*
     * Honeypot spam field.
     * Normal customers never see or complete this field.
     */
    if (body.website) {
      return json({
        success: true,
        reference: createBookingReference(),
      });
    }

    const booking = {
      name: clean(body.name, 80),
      phone: clean(body.phone, 20),
      email: clean(body.email, 120).toLowerCase(),
      date: clean(body.date, 10),
      package: clean(body.package, 150),
      people: Number.parseInt(body.people, 10),
      pickup: clean(body.pickup, 140),
      message: clean(body.message, 500),
    };

    const selectedPackage = packages.find(
      (item) => item.name === booking.package,
    );

    const today = new Date().toISOString().slice(0, 10);

    if (booking.name.length < 2) {
      return json({ error: 'Please enter your full name.' }, 400);
    }

    if (!PHONE_PATTERN.test(booking.phone)) {
      return json({ error: 'Please enter a valid contact number.' }, 400);
    }

    if (!EMAIL_PATTERN.test(booking.email)) {
      return json({ error: 'Please enter a valid email address.' }, 400);
    }

    if (!selectedPackage) {
      return json({ error: 'Please select a valid package.' }, 400);
    }

    if (booking.date && booking.date < today) {
      return json({ error: 'Tour date cannot be in the past.' }, 400);
    }

    if (
      !Number.isInteger(booking.people) ||
      booking.people < 1 ||
      booking.people > 50
    ) {
      return json(
        { error: 'Number of people must be between 1 and 50.' },
        400,
      );
    }

    const reference = createBookingReference();
    const estimatedTotal = selectedPackage.newPrice * booking.people;

    const details = `
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5"><strong>Reference</strong></td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5">${escapeHtml(reference)}</td>
        </tr>
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5"><strong>Name</strong></td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5">${escapeHtml(booking.name)}</td>
        </tr>
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5"><strong>Email</strong></td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5">${escapeHtml(booking.email)}</td>
        </tr>
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5"><strong>Phone</strong></td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5">${escapeHtml(booking.phone)}</td>
        </tr>
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5"><strong>Package</strong></td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5">${escapeHtml(booking.package)}</td>
        </tr>
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5"><strong>Tour date</strong></td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5">${escapeHtml(booking.date || 'Not specified')}</td>
        </tr>
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5"><strong>People</strong></td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5">${booking.people}</td>
        </tr>
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5"><strong>Estimated total</strong></td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5">AED ${estimatedTotal}</td>
        </tr>
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5"><strong>Pickup</strong></td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5">${escapeHtml(booking.pickup || 'Not specified')}</td>
        </tr>
        <tr>
          <td style="padding:8px"><strong>Request</strong></td>
          <td style="padding:8px">${escapeHtml(booking.message || 'None')}</td>
        </tr>
      </table>
    `;

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.batch.send([
      {
        from: process.env.BOOKING_FROM_EMAIL,
        to: [booking.email],
        subject: `Booking request received — ${reference}`,
        html: `
          <div style="max-width:640px;margin:auto;font-family:Arial,sans-serif;color:#111">
            <h1 style="font-size:26px">Thank you, ${escapeHtml(booking.name)}</h1>

            <p>
              We have received your booking request. Our team will contact you
              shortly to confirm availability and final details.
            </p>

            ${details}

            <p style="margin-top:24px">
              <strong>Important:</strong> This email confirms receipt of your
              request. Your tour is confirmed after our team verifies availability.
            </p>

            <p>Crown Desert Safari</p>
          </div>
        `,
      },
      {
        from: process.env.BOOKING_FROM_EMAIL,
        to: [process.env.OWNER_EMAIL],
        subject: `New booking request — ${reference}`,
        html: `
          <div style="max-width:640px;margin:auto;font-family:Arial,sans-serif;color:#111">
            <h1 style="font-size:26px">New booking request</h1>
            <p>A new booking request was submitted through the website.</p>
            ${details}
          </div>
        `,
      },
    ]);

    if (error) {
      console.error('Resend error:', error);
      return json(
        { error: 'We could not send your confirmation email. Please try again.' },
        502,
      );
    }

    return json({
      success: true,
      reference,
      emailIds: data?.data?.map((item) => item.id) ?? [],
    });
  } catch (error) {
    console.error('Booking function error:', error);

    return json(
      { error: 'Something went wrong. Please try again.' },
      500,
    );
  }
}

export const config = {
  path: '/api/bookings',
};