// Source: System Specifications -> Overview: 5.2 Common constants
//
/** Identifier for KNXnet/IP protocol version 1.0 */
export const KNXNETIP_VERSION_10 = 0x10;
/** Constant size of KNXnet/IP header as defined in protocol version 1.0 (System Specifications -> Overview: 5.2) */
export const HEADER_SIZE_10 = 0x06;

// Source: System Specifications -> Overview: 5.9 Internet Protocol constants
//
/** KNXnet/IP Port Number */
export const KNXNETIP_PORT = 3671;
/** KNXnet/IP System Setup Multicast Address */
export const KNXNETIP_MULTICAST_ADDRESS = '224.0.23.12';

// Source: System Specifications -> Overview: 5.3 KNXnet/IP services
//
export enum ServiceType {
  // Core KNXnet/IP services
  /** Sent by KNXnet/IP Client to search available KNXnet/IP Servers. */
  SEARCH_REQUEST = 0x0201,
  /** Sent by KNXnet/IP Server when receiving a KNXnet/IP SEARCH_REQUEST. */
  SEARCH_RESPONSE = 0x0202,
  /** Sent by KNXnet/IP Client to a KNXnet/IP Server to retrieve information about capabilities and supported services. */
  DESCRIPTION_REQUEST = 0x0203,
  /** Sent by KNXnet/IP Server in response to a DESCRIPTION_REQUEST to provide information about the server implementation. */
  DESCRIPTION_RESPONSE = 0x0204,
  /** Sent by KNXnet/IP Client for establishing a communication channel to a KNXnet/IP Server. */
  CONNECT_REQUEST = 0x0205,
  /** Sent by KNXnet/IP Server as answer to CONNECT_REQUEST telegram. */
  CONNECT_RESPONSE = 0x0206,
  /** Sent by KNXnet/IP Client for requesting the connection state of an established connection to a KNXnet/IP Server. */
  CONNECTIONSTATE_REQUEST = 0x0207,
  /** Sent by KNXnet/IP Server when receiving a CONNECTIONSTATE_REQUEST for an established connection. */
  CONNECTIONSTATE_RESPONSE = 0x0208,
  /** Sent by KNXnet/IP device, typically the KNXnet/IP Client, to terminate an established connection. */
  DISCONNECT_REQUEST = 0x0209,
  /** Sent by KNXnet/IP device, typically the KNXnet/IP Server, in response to a DISCONNECT_REQUEST. */
  DISCONNECT_RESPONSE = 0x020A,
  // Device Management services
  /** Reads/Writes KNXnet/IP device configuration data (Interface Object Properties) */
  DEVICE_CONFIGURATION_REQUEST = 0x0310,
  /** Sent by a KNXnet/IP device to confirm the reception of the DEVICE_CONFIGURATION_REQUEST. */
  DEVICE_CONFIGURATION_ACK = 0x0311,
  // Tunnelling services
  /** Used for sending and receiving single KNX telegrams between KNXnet/IP Client and - Server. */
  TUNNELING_REQUEST = 0x0420,
  /** Sent by a KNXnet/IP device to confirm the reception of the TUNNELING_REQUEST. */
  TUNNELING_ACK = 0x0421,
  // Routing services
  /** Used for sending KNX telegrams over IP networks. This service is unconfirmed. */
  ROUTING_INDICATION = 0x0530,
  /** Used for indication of lost KNXnet/IP Routing messages. This service is unconfirmed. */
  ROUTING_LOST_MESSAGE = 0x0531
}

// Source: System Specifications -> Overview: 5.4 Connection types
//
export enum ConnectionType {
  /** Data connection used to configure a KNXnet/IP device. */
  DEVICE_MGMT_CONNECTION = 0x03,
  /** Data connection used to forward KNX telegrams between two KNXnet/IP devices. */
  TUNNEL_CONNECTION = 0x04,
  /** Data connection used for configuration and data transfer with a remote logging server. */
  REMLOG_CONNECTION = 0x06,
  /** Data connection used for data transfer with a remote configuration server. */
  REMCONF_CONNECTION = 0x07,
  /** Data connection used for configuration and data transfer with an Object Server in a KNXnet/IP device. */
  OBJSVR_CONNECTION = 0x08
}

// Source: System Specifications -> Overview: 5.5 Error codes
//
export enum ErrorCodes {
  // Common error codes
  /** Operation successful
   * CONNECT_RESPONSE: The connection is established successfully
   * CONNECTIONSTATE_RESPONSE: The connection state is normal.
   * CONNECT_ACK: The message is received successfully.
   * DEVICE_CONFIGURATION_ACK: The message is received successfully.
   */
  E_NO_ERROR = 0x00,
  /** The requested host protocol is not supported by the KNXnet/IP device. */
  E_HOST_PROTOCOL_TYPE = 0x01,
  /** The requested protocol version is not supported by the KNXnet/IP device. */
  E_VERSION_NOT_SUPPORTED = 0x02,
  /** The received sequence number is out of order. */
  E_SEQUENCE_NUMBER = 0x04,
  // CONNECT RESPONSE status codes
  /** The KNXnet/IP Server device does not support the requested connection type. */
  E_CONNECTION_TYPE = 0x22,
  /**The KNXnet/IP Server device does not support one or more requested connection options.  */
  E_CONNECTION_OPTION = 0x23,
  /** The KNXnet/IP Server device cannot accept the new data connection because
   * its maximum amount of concurrent connections is already used. */
  E_NO_MORE_CONNECTIONS = 0x24,
  // CONNECTIONSTATE_RESPONSE status codes
  /** The KNXnet/IP Server device cannot find an active data connection with the specified ID. */
  E_CONNECTION_ID = 0x21,
  /** The KNXnet/IP Server device detects an error concerning the data connection with the specified ID. */
  E_DATA_CONNECTION = 0x26,
  /** The KNXnet/IP Server device detects an error concerning the KNX connection with the specified ID. */
  E_KNX_CONNECTION = 0x27,
  // Tunnelling CONNECT_ACK error codes
  /** The KNXnet/IP Server device does not support the requested KNXnet/IP Tunnelling layer. */
  E_TUNNELING_LAYER = 0x29
}

// Source: System Specifications -> Overview: 5.6 Description Information Block (DIB)
//
// Reserved 03h – FDh 1 Reserved for future use.
export enum DescriptionType {
  /** Device information e.g. KNX medium. */
  DEVICE_INFO = 0x01,
  /** Service families supported by the device. */
  SUPP_SVC_FAMILIES = 0x02,
  /** DIB structure for further data defined by device manufacturer. */
  MFR_DATA = 0xFE,
  /** Not used. */
  'Not used' = 0xFF
}

// Source: System Specifications -> Overview: 5.6 Description Information Block (DIB)
//
// reserved = 0x01
// reserved = 0x08
export enum KnxMediumCodes {
  /** KNX TP1 = KNX TP */
  KNX_TP = 0x02,
  /** KNX PL110 */
  PL110 = 0x04,
  /** KNX RF */
  RF = 0x10,
  /** KNX IP */
  KNX_IP = 0x20
}

// Source: System Specifications -> Overview: 5.7 Host protocol codes
//
export enum HostProtocolCodes {
  /** Identifies an Internet Protocol version 4 address and port number for UDP communication. */
  IPV4_UDP = 0x01,
  /** Identifies an Internet Protocol version 4 address and port number for TCP communication. */
  IPV4_TCP = 0x02
}

// Source: System Specifications -> Overview: 5.8 Timeout constants
//
export enum Timeouts {
  /** KNXnet/IP Client shall wait for 10 seconds for a CONNECT_RESPONSE frame from KNXnet/IP Server. */
  CONNECT_REQUEST_TIMEOUT = 10,
  /** KNXnet/IP Client shall wait for 10 seconds for a CONNECTIONSTATE_RESPONSE frame from KNXnet/IP Server. */
  CONNECTIONSTATE_REQUEST_TIMEOUT = 10,
  /** KNXnet/IP Client shall wait for 10 seconds for a DEVICE_CONFIGURATION_RESPONSE frame from KNXnet/IP Server. */
  DEVICE_CONFIGURATION_REQUEST_TIMEOUT = 10,
  /** KNXnet/IP Client shall wait for 1 second for a TUNNELING_ACK response on a TUNNELING_REQUEST frame from KNXnet/IP Server. */
  TUNNELING_REQUEST_TIMEOUT = 1,
  /** If the KNXnet/IP Server does not receive a heartbeat request within 120 seconds of the last correctly received message frame,
   * the server shall terminate the connection by sending a DISCONNECT_REQUEST to the client’s control endpoint. */
  CONNECTION_ALIVE_TIME = 120
}

export enum LinkLayer {
  LINK_LAYER = 0x02,      /** Tunneling on link layer, establishes a link layer tunnel to the KNX network.*/
  RAW_LAYER = 0x04,  /** Tunneling on raw layer, establishes a raw tunnel to the KNX network. */
  BUSMONITOR_LAYER = 0x80 /** Tunneling on busmonitor layer, establishes a busmonitor tunnel to the KNX network.*/
}

export enum ProtocolVersion {
  '1.0' = KNXNETIP_VERSION_10
}
