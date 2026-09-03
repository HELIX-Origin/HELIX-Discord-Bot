import pc from 'picocolors';
import { logger } from '../../utils/logger/index.js';

export function getBashCompletion(): string {
  return `_helix_completions() {
  local cur="\${COMP_WORDS[COMP_CWORD]}"
  local prev="\${COMP_WORDS[COMP_CWORD-1]}"
  local commands="create list ai repo info update completion"

  if [ "\$COMP_CWORD" -eq 1 ]; then
    COMPREPLY=( $(compgen -W "\$commands" -- "\$cur") )
    return 0
  fi

  case "\$prev" in
    create)
      COMPREPLY=( $(compgen -W "discord-bot web desktop mobile game-engine backend" -- "\$cur") )
      ;;
    list)
      COMPREPLY=( $(compgen -W "agents skills templates all" -- "\$cur") )
      ;;
    ai)
      COMPREPLY=( $(compgen -W "status test query generate" -- "\$cur") )
      ;;
    repo)
      COMPREPLY=( $(compgen -W "status create" -- "\$cur") )
      ;;
    *)
      ;;
  esac
}
complete -F _helix_completions helix
`;
}

export function getPowerShellCompletion(): string {
  return `Register-ArgumentCompleter -Native -CommandName helix -ScriptBlock {
    param($wordToComplete, $commandAst, $cursorPosition)
    $commands = @('create', 'list', 'ai', 'repo', 'info', 'update', 'completion')
    $types = @('discord-bot', 'web', 'desktop', 'mobile', 'game-engine', 'backend')
    $aiActions = @('status', 'test', 'query', 'generate')
    $repoActions = @('status', 'create')

    $elements = $commandAst.ToString().Split(' ')
    if ($elements.Count -le 2) {
        $commands | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
            [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
        }
    } elseif ($elements[1] -eq 'create' -and $elements.Count -le 3) {
        $types | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
            [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
        }
    } elseif ($elements[1] -eq 'ai') {
        $aiActions | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
            [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
        }
    }
}
`;
}

export function getZshCompletion(): string {
  return `#compdef helix

_helix() {
  local -a commands
  commands=(
    'create:Scaffold a new project from a multi-framework template'
    'list:List registered agents, skills, and templates'
    'ai:Manage and interact with AI agent integrations'
    'repo:Manage code hosting platforms and remote repositories'
    'info:Show system diagnostic and detected CLI toolchain versions'
    'update:Check for HELIX CLI updates'
    'completion:Generate shell autocompletion script'
  )

  _arguments '1: :->command' '*: :->args'

  case $state in
    command)
      _describe -t commands 'helix commands' commands
      ;;
  esac
}

_helix "$@"
`;
}

export async function completionCommand(shell?: string): Promise<void> {
  const target = (shell || 'bash').toLowerCase();

  if (target === 'bash') {
    console.log(getBashCompletion());
  } else if (target === 'zsh') {
    console.log(getZshCompletion());
  } else if (target === 'powershell' || target === 'pwsh') {
    console.log(getPowerShellCompletion());
  } else {
    logger.error(`Unsupported shell: "${shell}". Supported: bash, zsh, powershell`);
    logger.info('Usage: helix completion [bash|zsh|powershell]');
  }
}

export default completionCommand;
