import QRCode from 'qrcode'

/**
 * Calculates EMVCo CRC16 Checksum
 * @param {string} data 
 * @returns {string} 4-character hex uppercase CRC
 */
function crc16(data) {
  let crc = 0xFFFF
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xFF
    x ^= x >> 4
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * Format field to EMVCo standard (ID + Length + Value)
 */
function formatTag(id, value) {
  const len = value.length.toString().padStart(2, '0')
  return `${id}${len}${value}`
}

/**
 * Generates official EMVCo PromptPay Payload string
 * @param {string} target - Mobile number (e.g. 0812345678) or National ID (13 digits) or e-Wallet ID (15 digits)
 * @param {number|null} amount - Transaction amount in THB (optional)
 * @returns {string} EMVCo PromptPay payload
 */
export function generatePromptPayPayload(target, amount = null) {
  const cleaned = target.replace(/[^0-9]/g, '')
  let targetTag = ''

  if (cleaned.length === 10) {
    // Phone number format: 0066 + 9 digits (drop leading 0)
    const phone = `0066${cleaned.substring(1)}`
    targetTag = formatTag('01', phone)
  } else if (cleaned.length === 13) {
    // National ID / Tax ID
    targetTag = formatTag('02', cleaned)
  } else if (cleaned.length === 15) {
    // e-Wallet ID
    targetTag = formatTag('03', cleaned)
  } else {
    // Fallback to phone format
    targetTag = formatTag('01', `0066${cleaned.substring(cleaned.startsWith('0') ? 1 : 0)}`)
  }

  // Tag 29: Merchant Account Information - PromptPay
  const aid = formatTag('00', 'A000000677010111')
  const tag29 = formatTag('29', `${aid}${targetTag}`)

  // Tag 00: Payload Format Indicator
  let payload = formatTag('00', '01')
  // Tag 01: Point of Initiation Method (11 = Static QR, 12 = Dynamic QR with amount)
  payload += formatTag('01', amount ? '12' : '11')
  // Add Tag 29
  payload += tag29
  // Tag 53: Transaction Currency (764 = THB)
  payload += formatTag('53', '764')
  // Tag 54: Transaction Amount (if specified)
  if (amount && Number(amount) > 0) {
    const formattedAmount = Number(amount).toFixed(2)
    payload += formatTag('54', formattedAmount)
  }
  // Tag 58: Country Code (TH)
  payload += formatTag('58', 'TH')
  // Tag 63: CRC Checksum indicator
  payload += '6304'

  // Append calculated CRC16
  payload += crc16(payload)
  return payload
}

/**
 * Generates Data URL image for PromptPay QR Code
 * @param {string} target - Mobile number or National ID
 * @param {number|null} amount - Transaction amount
 * @param {object} options - QRCode generation options
 * @returns {Promise<string>} Base64 Data URL of QR Code
 */
export async function generatePromptPayQRDataUrl(target, amount = null, options = {}) {
  const payload = generatePromptPayPayload(target, amount)
  const defaultOptions = {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 8,
    color: {
      dark: '#0B2D5F',
      light: '#FFFFFF'
    },
    ...options
  }
  return await QRCode.toDataURL(payload, defaultOptions)
}
