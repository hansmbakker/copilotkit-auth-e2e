import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

// Configure the OTLP endpoint for standalone dashboard
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317';

// Create resource with service name
const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME,
});

const sdk = new NodeSDK({
    resource: resource,
    traceExporter: new OTLPTraceExporter({
        url: otlpEndpoint,
    }),
    metricReader: new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
            url: otlpEndpoint,
        }),
        exportIntervalMillis: 5000,
    }),
    instrumentations: [getNodeAutoInstrumentations({
        // Disable file system instrumentation to reduce noise
        '@opentelemetry/instrumentation-fs': {
            enabled: false,
        },
    })],
});

sdk.start();

console.log('✅ OpenTelemetry configured for Aspire dashboard');

process.on('SIGTERM', () => {
    sdk.shutdown()
        .then(() => console.log('Tracing terminated'))
        .catch((error) => console.log('Error terminating tracing', error))
        .finally(() => process.exit(0));
});