import * as vscode from 'vscode';

// This ends up as the `type` key in tasks.json. RLS also uses `cargo` and
// our configuration should be compatible with it so use the same key.
const TASK_TYPE = 'cargo';

export function activateTaskProvider(target: vscode.WorkspaceFolder): vscode.Disposable {
    const provider: vscode.TaskProvider = {
        // Detect Rust tasks. Currently we do not do any actual detection
        // of tasks (e.g. aliases in .cargo/config) and just return a fixed
        // set of tasks that always exist. These tasks cannot be removed in
        // tasks.json - only tweaked.
        provideTasks: () => getStandardCargoTasks(target),

        // We don't need to implement this.
        resolveTask: () => undefined,
    };

    return vscode.tasks.registerTaskProvider(TASK_TYPE, provider);
}

function getStandardCargoTasks(target: vscode.WorkspaceFolder): vscode.Task[] {
    return [
        { command: 'build', group: vscode.TaskGroup.Build },
        { command: 'check', group: vscode.TaskGroup.Build },
        { command: 'test', group: vscode.TaskGroup.Test },
        { command: 'clean', group: vscode.TaskGroup.Clean },
        { command: 'run', group: undefined },
    ]
        .map(({ command, group }) => {
            const vscodeTask = new vscode.Task(
                // The contents of this object end up in the tasks.json entries.
                {
                    type: TASK_TYPE,
                    command,
                },
                // The scope of the task - workspace or specific folder (global
                // is not supported).
                target,
                // The task name, and task source. These are shown in the UI as
                // `${source}: ${name}`, e.g. `rust: cargo build`.
                `cargo ${command}`,
                'rust',
                // What to do when this command is executed.
                new vscode.ShellExecution('cargo', [command]),
                // Problem matchers.
                ['$rustc'],
            );
            vscodeTask.group = group;
            return vscodeTask;
        });
}
