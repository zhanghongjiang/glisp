<template>
	<div class="InputRect2d">
		[
		<InputNumber
			class="InputRect2d__el"
			:value="value[0]"
			@input="onInput(0, $event)"
		/>
		<InputNumber
			class="InputRect2d__el"
			:value="value[1]"
			@input="onInput(1, $event)"
		/>
		<InputNumber
			class="InputRect2d__el"
			:value="value[2]"
			@input="onInput(2, $event)"
		/>
		<InputNumber
			class="InputRect2d__el"
			:value="value[3]"
			@input="onInput(3, $event)"
		/>]
		<button
			class="InputRect2d__drag"
			:class="{dragging: drag.isDragging}"
			ref="dragEl"
		/>
	</div>
</template>

<script lang="ts">
import {defineComponent, ref, Ref, watch, PropType} from '@vue/composition-api'
import InputNumber from './InputNumber.vue'
import {useDraggable} from '@/components/use'

export default defineComponent({
	name: 'InputRect2d',
	components: {InputNumber},
	props: {
		value: {
			type: Array as PropType<number[]>,
			required: true
		}
	},
	setup(props, context) {
		const dragEl: Ref<null | HTMLElement> = ref(null)

		const onInput = (i: number, v: number) => {
			const value = [...props.value]
			value[i] = v

			context.emit('input', value)
		}

		const drag = useDraggable(dragEl)

		watch(
			() => [drag.isDragging, drag.deltaX, drag.deltaY],
			([isDragging, x, y]) => {
				if (!isDragging) return

				const newValue = [...props.value]
				newValue[0] += x as number
				newValue[1] += y as number
				context.emit('input', newValue)
			}
		)

		return {
			dragEl,
			onInput,
			drag
		}
	}
})
</script>

<style lang="stylus">
@import '../style/common.styl'

.InputRect2d
	display flex
	line-height $input-height

	&__el
		margin-right 0.5em
		width 3em

		&:last-child
			margin-right 0

	&__drag
		position relative
		margin-left 0.5rem
		width 1.1rem
		height @width
		border 1px solid var(--comment)

		&:hover, &.dragging
			background var(--comment)

			&:before, &:after
				background var(--background)

		&:before, &:after
			position absolute
			display block
			background var(--comment)
			content ''

		&:before
			top 2px
			left calc(50% - 0.5px)
			width 1px
			height calc(100% - 4px)

		&:after
			top calc(50% - 0.5px)
			left 2px
			width calc(100% - 4px)
			height 1px
</style>
