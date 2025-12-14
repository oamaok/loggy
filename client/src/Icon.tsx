import { FC } from 'kaiku'
import styles from './Icon.css'

const Icon: FC<{ name: string }> = ({ name }) => {
  return <div class={['material-symbols-outlined', styles.icon]}>{name}</div>
}

export default Icon
