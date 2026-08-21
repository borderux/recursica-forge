import type { TableProps } from '../../common/Table'

export default function Table(props: TableProps) {
  return <table className={props.className} style={props.style}>{props.children}</table>
}
