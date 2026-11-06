import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import path from 'path';

// Load environment variables from .env with override enabled
dotenv.config({ override: true });


const app = express();
app.use(express.json());

const RAZORPAY_KEY_ID =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'rzp_test_TwQeY3q2SKyMCY'
    ? process.env.RAZORPAY_KEY_ID
    : 'rzp_live_TwReofbXIfEGXk';
const RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== 'OkRPe0KeGpoqRbDM1rRB5mLk'
    ? process.env.RAZORPAY_KEY_SECRET
    : 'ipp92NPh5OIoyX9bWr9qmRlF';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

// Initialize Razorpay SDK instance
let razorpay: Razorpay | null = null;
try {
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
    console.log('[Razorpay] Initialized successfully with Live Key ID:', RAZORPAY_KEY_ID);
  } else {
    console.warn('[Razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET');
  }
} catch (err) {
  console.error('[Razorpay] Failed to initialize instance:', err);
}

// ============================================================================
// STEP 1: BACKEND - Create Order
// ============================================================================
// Endpoint: POST /api/create-order, /api/v1/create-order, /api/v1/golden/create-order
// Call Razorpay API: POST https://api.razorpay.com/v1/orders
// Request: { amount (paise), currency, receipt }
// Return: { order_id, amount, currency, key_id }
// Strictly enforces ₹1 (100 paise) server-side
// ============================================================================
const handleCreateOrder = async (req: Request, res: Response) => {
  try {
    if (!razorpay) {
      return res.status(500).json({
        error: 'Razorpay SDK is not initialized. Check server credentials.',
      });
    }

    // Strictly enforce ₹1 (100 paise) for Lifetime Golden
    const amount = 100;
    const currency = 'INR';
    const receipt = req.body.receipt || `gld_rcpt_${Date.now()}`;

    const options = {
      amount,
      currency,
      receipt: String(receipt).slice(0, 40),
      notes: {
        package: 'Lifetime Golden',
        userId: req.body.userId || 'student',
      },
    };

    console.log('[Razorpay] Creating order with options:', options);
    const order = await razorpay.orders.create(options);

    console.log('[Razorpay] Order created successfully:', order.id);
    return res.status(200).json({
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      key_id: RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error('[Razorpay] Create order failed:', err);
    const statusCode = err?.statusCode || 500;
    return res.status(statusCode).json({
      error: err?.error?.description || err?.message || 'Failed to create Razorpay order',
      details: err,
    });
  }
};

app.post('/api/create-order', handleCreateOrder);
app.post('/api/v1/create-order', handleCreateOrder);
app.post('/api/v1/golden/create-order', handleCreateOrder);


// ============================================================================
// STEP 3: BACKEND - Verify Signature
// ============================================================================
// Endpoint: POST /api/verify-payment (and /api/v1/golden/verify-payment)
// Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
// Compare generated signature with razorpay_signature
// Return success only if signatures match
// ============================================================================
const handleVerifyPayment = (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

    // Check missing fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Missing required payment verification parameters (razorpay_order_id, razorpay_payment_id, razorpay_signature are required).',
      });
    }

    if (!RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        verified: false,
        error: 'Server configuration error: Razorpay Key Secret is missing.',
      });
    }

    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Compare generated signature with razorpay_signature
    const sigBuffer = Buffer.from(String(razorpay_signature).trim(), 'utf-8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');

    const isSignatureValid =
      sigBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, sigBuffer);

    if (!isSignatureValid) {
      console.warn('[Razorpay] Signature mismatch for order:', razorpay_order_id);
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Payment verification failed: Signature mismatch.',
      });
    }

    console.log('[Razorpay] Payment verified successfully! Order:', razorpay_order_id, 'Payment:', razorpay_payment_id);

    return res.status(200).json({
      success: true,
      verified: true,
      isGolden: true,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      message: 'Payment verified successfully! Golden membership is now unlocked.',
    });
  } catch (err: any) {
    console.error('[Razorpay] Payment verification error:', err);
    return res.status(500).json({
      success: false,
      verified: false,
      error: err?.message || 'Internal server error while verifying payment signature',
    });
  }
};

app.post('/api/verify-payment', handleVerifyPayment);
app.post('/api/v1/verify-payment', handleVerifyPayment);
app.post('/api/golden/verify-payment', handleVerifyPayment);
app.post('/api/v1/golden/verify-payment', handleVerifyPayment);

// Razorpay Webhook Handler
const handleWebhook = (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    if (RAZORPAY_WEBHOOK_SECRET && signature) {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const expected = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');
      const sigBuffer = Buffer.from(signature, 'utf-8');
      const expBuffer = Buffer.from(expected, 'utf-8');
      if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
        return res.status(400).json({ error: 'Webhook signature mismatch' });
      }
    }
    console.log('[Razorpay Webhook] Received webhook event:', req.body?.event);
    return res.status(200).json({ status: 'ok', received: true });
  } catch (err: any) {
    console.error('[Razorpay Webhook Error]:', err);
    return res.status(500).json({ error: err?.message || 'Webhook handling error' });
  }
};

app.post('/api/golden/webhook', handleWebhook);
app.post('/api/v1/golden/webhook', handleWebhook);
app.post('/api/webhook/razorpay', handleWebhook);
app.post('/api/v1/webhook/razorpay', handleWebhook);

// Golden status config
app.get(['/api/golden/status', '/api/v1/golden/status', '/api/status', '/api/v1/status'], (req, res) => {
  res.json({
    available: true,
    price: 1,
    priceInPaise: 100,
    currency: 'INR',
    key_id: RAZORPAY_KEY_ID,
    package: 'Lifetime Golden',
    description: 'Unlock PDF downloads for all study materials, permanently.',
  });
});


// Proxy other backend requests to Render Spring Boot backend
const RENDER_BACKEND = 'https://frontpageflip-backend.onrender.com';
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/v1/') || req.path.startsWith('/api/')) {
    try {
      const targetUrl = `${RENDER_BACKEND}${req.originalUrl}`;
      const headers: Record<string, string> = {};
      for (const [key, val] of Object.entries(req.headers)) {
        if (key.toLowerCase() !== 'host' && typeof val === 'string') {
          headers[key] = val;
        }
      }

      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
      };

      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
        fetchOptions.body = JSON.stringify(req.body);
        headers['content-type'] = 'application/json';
      }

      const backendRes = await fetch(targetUrl, fetchOptions);
      res.status(backendRes.status);
      backendRes.headers.forEach((val, key) => {
        if (!['transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
          res.setHeader(key, val);
        }
      });

      const buffer = await backendRes.arrayBuffer();
      return res.send(Buffer.from(buffer));
    } catch (err: any) {
      console.warn('[Proxy Error] Could not forward to Render backend:', err?.message);
      return res.status(503).json({
        status: 503,
        error: 'Backend Gateway Unavailable',
        message: 'Could not connect to the backend service. If the server was sleeping on Render, it is now waking up; please retry in 30 seconds.',
      });
    }
  }
  next();
});

// ============================================================================
// VITE MIDDLEWARE / STATIC ASSETS
// ============================================================================
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Front-Page Flip Server running on port ${PORT}`);
  });
}

startServer();
