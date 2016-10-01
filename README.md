# javascript knx library in typescript

This will grow to a KNX library for talking to the KNX bus via KNXnet/IP without dependency to an additional eibd or knxd service running.

**Do not use in production yet, this is still in development!**
Help is always welcome.

## Usage

For now, see [`src/examples/busmonitor.ts`](src/examples//busmonitor.ts) as starting point.

## Features / High level ToDo's
-   [X] fully implemented in typescript to be used directly in typescript projects
-   [ ] implemented wherever applicable as defined in the latest KNX Specifications (at the time of writing 2.1 from 2013) of [KNX Association](https://www.knx.org).
-   [ ] Connection Support
    -   [ ] Tunnel connection
        -   [X] as client
            -  [X] auto discovery with search request over multicast
        -   [ ] as server (knx ip router)
    -   [ ] Router connection
        -   [ ] as client
        -   [ ] as server (knx ip router)
-   [ ] Additional functions
    -   [ ] support for handling DPT conversion
        -   [ ] support to import knx project GA's for automatically convert to the correct DPT
    -   [ ] support for optional caching layer to save last seen values by group addresses.
-   [ ] testable with test's

# Ideas for the future
-   [ ] implement `UdpSocket` based on chrome.sockets.udp for support to run in the browser

## ToDo
-  [ ] testing
    - [ ] classes
      - [x] `UdpSocket`
      - [x] `IPHelper`
      - [ ] `KnxProtocol`
      - [ ] `KnxConnection`
        - [ ] `KnxTunnelConnection`
        - [ ] `KnxRouterConnection`
      - [ ] implement tests (should work without hardware by talking to itself and hard coded frames)
-   [ ] `KNXProtocol` improve parsing of packages (try rx implementation)
-   [X] implement example main app function as busmonitor
    - [ ] still requires DPT handling
-   [ ] aside to the library, direct usable command line script to write or read to the KNX GA's

## Licence
knxlib is licensed under the [MIT license](LICENSE).
