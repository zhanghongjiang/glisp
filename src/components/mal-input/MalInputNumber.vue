<template>
	<div class="MalInputNumber">
		<MalExpButton
			v-if="display.isExp && compact"
			:value="display.mode !== 'unit' ? value : value[1]"
			:compact="true"
			@click="$emit('select', $event)"
		/>
		<InputNumber
			:class="{
				exp: isExp || display.isExp,
				'grayed-out': display.mode === 'undefined'
			}"
			:value="displayValue"
			@input="onInput"
			:validator="innerValidator"
		/>
		<span
			class="MalInputNumber__unit"
			:class="{small: display.unit && display.unit.length >= 2}"
			v-if="display.mode === 'unit'"
			>{{ display.unit }}</span
		>
		<MalExpButton
			class="MalInputNumber__exp-after"
			v-if="display.isExp && !compact"
			:value="display.mode !== 'unit' ? value : value[1]"
			:compact="false"
			@click="$emit('select', $event)"
		/>
	</div>
</template>

<script lang="ts">
import {defineComponent, PropType, computed} from '@vue/composition-api'
import InputNumber from '@/components/inputs/InputNumber.vue'
import MalExpButton from '@/components/mal-input/MalExpButton.vue'
import {
	MalSeq,
	isList,
	M_FN,
	MalVal,
	MalSymbol,
	getEvaluated,
	MalType,
	createList as L
} from '@/mal/types'
import {getMapValue, getFnInfo, reverseEval} from '@/mal/utils'

type Validator = (v: number) => number | null

export default defineComponent({
	name: 'MalInputNumber',
	components: {InputNumber, MalExpButton},
	props: {
		value: {
			type: [Number, Array, Object] as PropType<number | MalSeq | MalSymbol>,
			required: true
		},
		validator: {
			type: Function as PropType<Validator>,
			required: false
		},
		compact: {
			type: Boolean,
			default: false
		},
		isExp: {
			type: Boolean,
			default: false
		}
	},
	setup(props, context) {
		const display = computed(() => {
			if (props.value === undefined) {
				return {mode: 'undefined', isExp: false}
			} else if (typeof props.value === 'number') {
				return {mode: 'number', isExp: false}
			} else if (isList(props.value) && props.value.length === 2) {
				const info = getFnInfo(props.value)

				if (info) {
					const inverseFn = getMapValue(info.meta, 'inverse', MalType.Function)
					const unit = getMapValue(info.meta, 'unit', MalType.String)

					if (inverseFn && unit) {
						const isExp = typeof (props.value as MalVal[])[1] !== 'number'
						return {mode: 'unit', unit, inverseFn, isExp}
					}
				}
			}
			return {mode: 'exp', isExp: true}
		})

		const fn = computed(() => {
			if (display.value.mode !== 'exp') {
				return (props.value as MalSeq)[M_FN]
			} else {
				return null
			}
		})

		const displayValue = computed(() => {
			switch (display.value.mode) {
				case 'number':
					return props.value as number
				case 'unit':
					return getEvaluated((props.value as MalVal[])[1]) as number
				case 'undefined':
					return 0
				default:
					// exp
					return getEvaluated(props.value) as number
			}
		})

		const innerValidator = computed(() => {
			if (props.validator) {
				if (display.value.mode === 'unit') {
					return (v: number) => {
						return (display.value.inverseFn as any)(
							(props.validator as any)((fn.value as any)(v))
						)[0]
					}
				} else {
					return props.validator
				}
			}
			return undefined
		})

		function onInput(value: number) {
			let newExp: MalVal = value
			if (display.value.mode === 'unit') {
				const unitVal = reverseEval(value, (props.value as MalVal[])[1])
				newExp = L((props.value as MalVal[])[0], unitVal)
			} else if (display.value.mode === 'exp') {
				newExp = reverseEval(value, props.value)
			}
			context.emit('input', newExp)
		}

		return {
			displayValue,
			display,
			innerValidator,
			onInput
		}
	}
})
</script>

<style lang="stylus">
@import '../style/common.styl'

.MalInputNumber
	display flex
	align-items center
	line-height $input-height

	&__unit
		padding-left 0.3em
		width 1rem
		color var(--comment)

		&.small
			height $input-height
			letter-spacing 0
			font-size 0.8em
			line-height $input-height * 1.2

	&__exp-after
		margin-left 0.3rem
</style>
