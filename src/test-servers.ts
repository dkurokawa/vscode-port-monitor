// Test script
import * as http from 'http';
import * as net from 'net';

/**
 * Create test HTTP server
 */
function createTestServer(port: number): http.Server {
    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`Test server running on port ${port}\n`);
    });
    
    server.listen(port, () => {
        console.log(`Test server started on port ${port}`);
    });
    
    return server;
}

/**
 * Create test TCP server
 */
function createTcpServer(port: number): net.Server {
    const server = net.createServer((socket) => {
        socket.write(`Connected to TCP server on port ${port}\n`);
        socket.on('data', (data) => {
            socket.write(`Echo: ${data}`);
        });
    });
    
    server.listen(port, () => {
        console.log(`TCP server started on port ${port}`);
    });
    
    return server;
}

/**
 * Start test servers
 */
function startTestServers() {
    const servers: (http.Server | net.Server)[] = [];
    
    // HTTP servers
    servers.push(createTestServer(3000));
    servers.push(createTestServer(3001));
    servers.push(createTestServer(3002));
    
    // TCP servers
    servers.push(createTcpServer(8080));
    servers.push(createTcpServer(9090));
    
    console.log('All test servers started');
    
    // Stop with Ctrl+C
    process.on('SIGINT', () => {
        console.log('\nShutting down test servers...');
        servers.forEach(server => server.close());
        process.exit(0);
    });
}

if (require.main === module) {
    startTestServers();
}

export { createTestServer, createTcpServer, startTestServers };
