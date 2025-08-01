import { colored } from 'nesoi/lib/engine/util/string';
import { MigrationFile, MigrationRoutine, MigrationRow } from '..';
import { AnyDaemon } from 'nesoi/lib/engine/daemon';

export class MigrationRunnerStatus {

    public items: {
        state: 'done' | 'pending' | 'lost' | 'modified'
        id?: number,
        service: string,
        module: string,
        name: string,
        description?: string,
        batch?: number,
        timestamp?: string
        hash?: string
        routine?: MigrationRoutine
    }[];

    public batch: number;

    constructor(
        daemon: AnyDaemon,
        migrationFiles: MigrationFile[],
        migrationRows: MigrationRow[]
    ) {
        this.items = migrationRows.map(migration => ({
            ...migration,
            state: 'lost'
        }));

        migrationFiles.forEach(migration => {
            const hash = migration.routine.hash;

            const old = this.items.find(item => item.name === migration.name);
            if (old) {
                if (!old.hash || old.hash === hash) {
                    old.state = 'done';
                }
                else {
                    old.state = 'modified';
                }
                old.routine = migration.routine;
            }
            else {
                this.items.push({
                    id: undefined,
                    service: migration.service,
                    module: migration.module,
                    name: migration.name,
                    description: migration.routine.description,
                    batch: undefined,
                    hash,
                    state: 'pending',
                    routine: migration.routine
                });
            }
        });

        const lastBatch = Math.max(...this.items.map(item => item.batch || 0), 0);
        this.batch = lastBatch;
    }

    public describe() {
        let str = '';
        str += `◆ ${colored('Migration Status', 'lightblue')}\n`;
        this.items.forEach(item => {
            const module = colored(item.module, 'lightcyan');
            if (item.module.startsWith('__')) {
                str += `└ ${item.id || '*'}\t${colored('nesoi', 'darkgray')}\t${module} ${item.name} @ ${item.batch || '...'}\n`;
                return;
            }
            const state = {
                'done': () => colored('done', 'green'),
                'pending': () => colored('pending', 'yellow'),
                'lost': () => colored('lost', 'red'),
                'modified': () => colored('modified', 'brown'),
            }[item.state]();
            str += `└ ${item.id || '*'}\t${state}\t${module} ${item.name} @ ${item.batch || '...'}\n`;
        });
        return str;
    }
}