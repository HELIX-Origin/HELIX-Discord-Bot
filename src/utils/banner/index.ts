import pc from 'picocolors';

export function showBanner(): void {
  console.log(
    pc.cyan(`
  ██╗  ██╗███████╗██╗     ██╗██╗  ██╗     ██████╗██╗     ██╗
  ██║  ██║██╔════╝██║     ██║╚██╗██╔╝    ██╔════╝██║     ██║
  ███████║█████╗  ██║     ██║ ╚███╔╝     ██║     ██║     ██║
  ██╔══██║██╔══╝  ██║     ██║ ██╔██╗     ██║     ██║     ██║
  ██║  ██║███████╗███████╗██║██╔╝ ██╗    ╚██████╗███████╗██║
  ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝╚═╝  ╚═╝     ╚═════╝╚══════╝╚═╝
    `) +
    pc.dim('  Universal Development Scaffolding & Multi-Agent Assistant\n')
  );
}
