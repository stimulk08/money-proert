import { Module } from '@nestjs/common';
import { createClient, Client } from 'tigerbeetle-node';

import { TigerBeetleRepository } from 'src/libs/tiger-beetle/tiget-beetle.repository';

@Module({
  providers: [
    {
      provide: 'TB_CLIENT',
      useFactory: async (): Promise<Client> => {
        const client = createClient({
          cluster_id: BigInt(0),
          replica_addresses: process.env.TB_HOSTS?.split(',') || [
            '0.0.0.0:3000',
          ],
        });

        // Initialize master account
        const repo = new TigerBeetleRepository(client);
        await repo.initializeSystemAccount();

        return client;
      },
    },
    TigerBeetleRepository,
  ],
  exports: [TigerBeetleRepository],
})
export class TigerBeetleModule {}
