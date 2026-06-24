import React from 'react'
import { renderToString } from 'react-dom/server'
import { Table } from '../src/components/adapters/Table'
import { UiKitProvider } from '../src/modules/uikit/UiKitContext'
import '../src/components/registry/mantine'

console.log("Rendering table...")
const html = renderToString(
  <UiKitProvider>
    <Table
      mantine={{
        striped: true,
        highlightOnHover: true,
      }}
    >
      <tbody>
        <tr>
          <td>Test</td>
        </tr>
      </tbody>
    </Table>
  </UiKitProvider>
)
console.log(html)
