export interface Guest {
  name: string
  phone: string
  email: string
  guest_count: number
  paid: boolean
  verified: boolean
}

export interface GuestFormPayload {
  name: string
  email: string
  guest_count: number
  paid: boolean
  verified: boolean
}