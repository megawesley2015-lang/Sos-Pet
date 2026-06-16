'use client'

import { forwardRef } from 'react'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'

type BgColor = 'orange' | 'teal' | 'black'

type Props = {
  petName: string
  photoUrl?: string
  petId: string
  bgColor?: BgColor
}

const BG_COLORS: Record<BgColor, string> = {
  orange: '#FF851B',
  teal: '#20B2AA',
  black: '#121214',
}

function truncateName(name: string, max = 20): string {
  return name.length > max ? name.slice(0, max) + '...' : name
}

export const PlaquinhaPreview = forwardRef<HTMLDivElement, Props>(
  ({ petName, photoUrl, petId, bgColor = 'orange' }, ref) => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aumigo.com.br'
    const qrValue = `${siteUrl}/pets/${petId}`
    const bg = BG_COLORS[bgColor]
    const displayName = truncateName(petName)

    return (
      <div
        ref={ref}
        style={{
          width: 300,
          height: 300,
          backgroundColor: bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          borderRadius: 16,
          padding: 16,
          boxSizing: 'border-box',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {photoUrl ? (
          <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '3px solid white' }}>
            <Image
              src={photoUrl}
              alt={petName}
              width={80}
              height={80}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              unoptimized
            />
          </div>
        ) : (
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid white',
              fontSize: 36,
            }}
          >
            🐾
          </div>
        )}

        <p
          style={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: 18,
            margin: 0,
            textAlign: 'center',
          }}
        >
          {displayName}
        </p>

        <div style={{ backgroundColor: 'white', padding: 8, borderRadius: 8 }}>
          <QRCodeSVG value={qrValue} size={100} />
        </div>

        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, margin: 0, textAlign: 'center' }}>
          SOS Pet Aumigo
        </p>
      </div>
    )
  }
)

PlaquinhaPreview.displayName = 'PlaquinhaPreview'
