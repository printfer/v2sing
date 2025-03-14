# v2sing

> `v2sing` is a tool designed to seamlessly convert subscription links from the **v2** or **clash** subscription formats to the [**sing-box**](https://sing-box.sagernet.org/) format, ensuring compatibility and simplifying migration.

## Supported Versions

`v2sing` is compatible with `sing-box >=1.11.0`. For best results, use the latest stable release.

## Supported Protocols

| Protocol        | Conversion (v2/clash → sing-box) |
|-----------------|----------------------------------|
| **VMess**       | ✅                               |
| **VLESS**       | ✅                               |
| **Shadowsocks** | ✅                               |
| **Trojan**      | ✅                               |

## Installation

You can self-host this project or deploy it to Cloudflare Workers. To deploy the project to Cloudflare Workers, download the latest release of `v2sing` from the [Releases page](https://github.com/printfer/v2sing/releases) and deploy it directly to the Cloudflare Workers instance you created.

## Usage

Use the `v2sing` tool by providing specific parameters. Below are the currently available parameters:

- `sub` (required) - The subscription URL to convert.
  - Example: `?sub=https://example.com/sub`
- `config` (optional) - The configuration template URL for advanced output customization. See [Creating a Configuration Template](#creating-a-configuration-template) section for more details.
  - Example: `?sub=https://example.com/sub&config=https://example.com/config_template.json`

### Creating a Configuration Template

You can create a configuration template just like a regular sing-box configuration file, but with placeholders to dynamically insert information from the subscription.

To get started, refer to the sample template provided [here](./src/config/template.json), which you can customize to suit your requirements.

Placeholders are written in the format `{{ placeholder_name }}` and are replaced with actual values at runtime.

Here are the currently available placeholders:

- `{{ outbounds_tags }}` - This placeholder is replaced with an array of outbound tags.
- `{{ outbounds }}` - This placeholder is replaced with a list of outbound configurations.

## Development

This project requires [Deno](https://deno.com/) version 2.0 or higher.

### Serving the Project

To start a development server, run:

```bash
deno task serve
```

### Building the Project

To build the project, run:

```bash
deno task build
```

The build artifacts will be located in the `dist` directory.

*Use `deno task` to explore additional available commands.*

## Changlog

See the [CHANGELOG.md](CHANGELOG.md) file for more information.

## License

[![](https://www.gnu.org/graphics/agplv3-with-text-162x68.png)](https://www.gnu.org/licenses/agpl-3.0.html)

This project is licensed under the AGPLv3 License. See the [LICENSE](LICENSE) file for more information.

## Credits

Copyright © 2024-2025 [Printfer](https://github.com/printfer)
