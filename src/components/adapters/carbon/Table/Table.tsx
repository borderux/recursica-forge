import type { TableProps } from '../../Table'

export default function Table(props: TableProps) {
  return <table className={props.className} style={props.style}>{props.children}</table>
}
