import { Router, Request, Response } from 'express';
import { routeToFIRStation } from '../lib/jurisdiction-service';
import { geocodeAddress } from '../lib/geocoding-adapter';
import { prisma } from '../lib/prisma';

const router = Router();

interface StationPolygon {
  id: string;
  name: string;
  polygon: [number, number][];
}

// Load station polygons from data file
let stationPolygons: StationPolygon[] = [];
try {
  stationPolygons = require('../data/stations.json');
} catch {
  console.warn('Station polygon data not found. Jurisdiction routing will use fallback.');
}

router.post('/route', async (req: Request, res: Response) => {
  try {
    const { address, lat, lng, firId } = req.body;

    let point: { lat: number; lng: number };

    if (lat !== undefined && lng !== undefined) {
      point = { lat: Number(lat), lng: Number(lng) };
    } else if (address) {
      const geocoded = await geocodeAddress(address);
      if (!geocoded) {
        res.status(422).json({ error: 'Could not geocode the provided address. Please try a different description or use map pin.' });
        return;
      }
      point = { lat: geocoded.lat, lng: geocoded.lng };
    } else {
      res.status(400).json({ error: 'Provide either address or lat/lng coordinates.' });
      return;
    }

    if (stationPolygons.length === 0) {
      res.status(503).json({ error: 'Jurisdiction data not loaded. Please select a station manually.' });
      return;
    }

    const result = routeToFIRStation(point, stationPolygons);

    // Log the routing decision if firId provided
    if (firId) {
      await prisma.jurisdictionLog.create({
        data: {
          firId,
          stationId: result.stationId,
          stationName: result.stationName,
          confidence: result.confidence,
          method: result.method,
          explanation: result.explanation,
          inputLat: point.lat,
          inputLng: point.lng,
          inputAddress: address,
        },
      });
    }

    res.json({ data: result });
  } catch (error) {
    console.error('Jurisdiction routing error:', error);
    res.status(500).json({ error: 'Internal error during jurisdiction routing.' });
  }
});

export default router;
