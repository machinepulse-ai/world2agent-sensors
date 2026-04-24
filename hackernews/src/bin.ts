#!/usr/bin/env node
import { run } from "@world2agent/sdk/sensor";
import sensor from "./index.js";

// Default transport: stdout, or HTTP POST if W2A_TRANSPORT_URL is set.
run(sensor);
