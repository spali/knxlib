export enum DataLinkLayer {
  // FROM NETWORK LAYER TO DATA LINK LAYER
  'L_Raw.req' = 0x10,
  /** Data Service. Primitive used for transmitting a data frame **/
  'L_Data.req' = 0x11,
  /** Poll Data Service **/
  'L_Poll_Data.req' = 0x13,
  // FROM DATA LINK LAYER TO NETWORK LAYER
  /** Poll Data Service **/
  'L_Poll_Data.con' = 0x25,
  /** Data Service. Primitive used for receiving a data frame **/
  'L_Data.ind' = 0x29,
  /** Bus Monitor Service **/
  'L_Busmon.ind' = 0x2B,
  'L_Raw.ind' = 0x2D,
  /** Data Service. Primitive used for local confirmation that a frame was sent (does not indicate a successful receive though) **/
  'L_Data.con' = 0x2E,
  'L_Raw.con' = 0x2F,
}

export enum FrameType {
  EXTENDED = 0x0,
  STANDARD = 0x1
}

export enum RepeatFlag {
  REPEAT = 0x0, // repeat frame on medium in case of an error
  NO_REPEAT = 0x1 // do not repeat
}

export enum Broadcast {
  SYSTEM_BROADCAST = 0x0,
  BROADCAST = 0x1
}

export enum Priority {
  SYSTEM = 0x0,
  NORMAL = 0x1,
  URGENT = 0x2,
  LOW = 0x3
}

export enum AckRequest {
  NO_ACK_REQUESTED = 0x0,
  ACK_REQUESTED = 0x1
}

export enum ConfirmFlag {
  E_NO_ERROR = 0x0,
  ERROR = 0x1
}

export enum DestAddressType {
  INDIVIDUAL = 0x0,
  GROUP_ADDRESS = 0x1
}

export enum ExtendedFrameFormat {
  STANDARD_FRAME = 0x0
}

export enum TpciCode {
  'UDT (Unnumbered Data Packet)' = 0x0,
  'NDT (Numbered Data Packet)' = 0x1,
  'UCD (Unnumbered )' = 0x2,
  'NCD (Numbered Control Data)' = 0x3
}

// first 4 bit in APCI (in extendend frame, there are 6 bit more to read)
export enum ApciType {
  'GroupValue_Read' = 0x0000,
  'GroupValue_Response' = 0x0001,
  'GroupValue_Write' = 0x0002,
  'PhysicalAddress_Write' = 0x0003,
  'PhysicalAddress_Read' = 0x0004,
  'PhysicalAddress_Response' = 0x0005,
  'ADC_Read' = 0x0006,
  'ADC_Response' = 0x0007,
  'Memory_Read' = 0x0008,
  'Memory_Response' = 0x0009,
  'Memory_Write' = 0x0010,
  'UserMemory' = 0x0011,
  'DeviceDescriptor_Read' = 0x0012,
  'DeviceDescriptor_Response' = 0x0013,
  'Restart' = 0x0014,
  'OTHER' = 0x0015 // if we need more
}
