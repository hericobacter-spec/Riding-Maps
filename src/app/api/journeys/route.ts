import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

export async function GET() {
  const sql = getSql();
  if (!sql) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
  }

  try {
    const rows = await sql`SELECT id, data, updated_at FROM journeys ORDER BY updated_at DESC`;
    const journeys = rows.map((r: any) => ({
      ...r.data,
      _dbId: r.id,
      _dbUpdatedAt: r.updated_at,
    }));
    return NextResponse.json({ journeys });
  } catch (err) {
    console.error("[DB] GET error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const sql = getSql();
  if (!sql) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
  }

  try {
    const { journeys } = await req.json();

    for (const journey of journeys) {
      const { _dbId, _dbUpdatedAt, ...data } = journey;
      await sql`
        INSERT INTO journeys (id, data, updated_at)
        VALUES (${data.id}, ${JSON.stringify(data)}, ${new Date(data.updatedAt).toISOString()})
        ON CONFLICT (id) DO UPDATE SET
          data = ${JSON.stringify(data)},
          updated_at = ${new Date(data.updatedAt).toISOString()}
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DB] PUT error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const sql = getSql();
  if (!sql) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await sql`DELETE FROM journeys WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DB] DELETE error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
