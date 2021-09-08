import { toRefs, watch, nextTick, computed } from 'composition-api'

export default function usePointer (props, context, dep)
{
  const {
    valueProp, showOptions, searchable, groupLabel,
    groups: groupped, groupOptions,
  } = toRefs(props)

  // ============ DEPENDENCIES ============

  const fo = dep.fo
  const fg = dep.fg
  const handleOptionClick = dep.handleOptionClick
  const handleGroupClick = dep.handleGroupClick
  const search = dep.search
  const pointer = dep.pointer
  const setPointer = dep.setPointer
  const clearPointer = dep.clearPointer
  const multiselect = dep.multiselect

  // ============== COMPUTED ==============

  // no export
  const options = computed(() => {
    return fo.value.filter(o => !o.disabled)
  })

  const groups = computed(() => {
    return fg.value.filter(o => !o.disabled)
  })

  const isPointerGroup = computed(() => {
    return pointer.value && pointer.value.group
  })

  const currentGroup = computed(() => {
    return getParentGroup(pointer.value)
  })

  const prevGroup = computed(() => {
    const group = isPointerGroup.value ? pointer.value : getParentGroup(pointer.value)
    const groupIndex = groups.value.map(g => g[groupLabel.value]).indexOf(group[groupLabel.value])
    let prevGroup = groups.value[groupIndex - 1]

    if (prevGroup === undefined) {
      prevGroup = lastGroup.value
    }

    return prevGroup
  })
  
  const nextGroup = computed(() => {
    let nextIndex = groups.value.map(g => g.label).indexOf(isPointerGroup.value
      ? pointer.value[groupLabel.value]
      : getParentGroup(pointer.value)[groupLabel.value]) + 1

    if (groups.value.length <= nextIndex) {
      nextIndex = 0
    }

    return groups.value[nextIndex]
  })

  const lastGroup = computed(() => {
    return [...groups.value].slice(-1)[0]
  })
  
  const currentGroupFirstOption = computed(() => {
    return pointer.value.__VISIBLE__[0]
  })

  const currentGroupPrevOption = computed(() => {
    const options = currentGroup.value.__VISIBLE__
    return options[options.map(o => o[valueProp.value]).indexOf(pointer.value[valueProp.value]) - 1]
  })
  
  const currentGroupNextOption = computed(() => {
    const options = getParentGroup(pointer.value).__VISIBLE__
    return options[options.map(o => o[valueProp.value]).indexOf(pointer.value[valueProp.value]) + 1]
  })

  const prevGroupLastOption = computed(() => {
    return [...prevGroup.value.__VISIBLE__].slice(-1)[0]
  })

  const lastGroupLastOption = computed(() => {
    return [...lastGroup.value.__VISIBLE__].slice(-1)[0]
  })

  // =============== METHODS ==============

  const isPointed = (option) => {
    return !!pointer.value && (
      (!option.group && pointer.value[valueProp.value] == option[valueProp.value]) ||
      (option.group !== undefined && pointer.value[groupLabel.value] == option[groupLabel.value])
    )
  }

  const setPointerFirst = () => {
    setPointer(options.value[0] || null)
  }

  const selectPointer = () => {
    if (!pointer.value || pointer.value.disabled === true) {
      return
    }

    if (isPointerGroup.value) {
      handleGroupClick(pointer.value)
    } else {
      handleOptionClick(pointer.value)
    }
  }

  const forwardPointer = () => {
    if (pointer.value === null) {
      setPointer((groupped.value ? groups.value[0] : options.value[0]) || null)
    }
    else if (groupped.value) {
      let nextPointer = isPointerGroup.value ? currentGroupFirstOption.value : currentGroupNextOption.value

      if (nextPointer === undefined) {
        nextPointer = nextGroup.value
      }

      setPointer(nextPointer || null)
    } else {
      let next = options.value.map(o => o[valueProp.value]).indexOf(pointer.value[valueProp.value]) + 1

      if (options.value.length <= next) {
        next = 0
      }

      setPointer(options.value[next] || null)
    }

    nextTick(() => {
      adjustWrapperScrollToPointer()
    })
  }

  const backwardPointer = () => {
    if (pointer.value === null) {
      let prevPointer = options.value[options.value.length - 1]

      if (groupped.value) {
        prevPointer = lastGroupLastOption.value

        if (prevPointer === undefined) {
          prevPointer = lastGroup.value
        }
      }

      setPointer(prevPointer  || null)
    }
    else if (groupped.value) {
      let prevPointer = isPointerGroup.value ? prevGroupLastOption.value : currentGroupPrevOption.value

      if (prevPointer === undefined) {
        prevPointer = isPointerGroup.value ? prevGroup.value : currentGroup.value
      }

      setPointer(prevPointer || null)
    } else {
      let prevIndex = options.value.map(o => o[valueProp.value]).indexOf(pointer.value[valueProp.value]) - 1

      if (prevIndex < 0) {
        prevIndex = options.value.length - 1
      }

      setPointer(options.value[prevIndex] || null)
    }

    nextTick(() => {
      adjustWrapperScrollToPointer()
    })
  }

  const getParentGroup = (option) => {
    return groups.value.find((group) => {
      return group.__VISIBLE__.map(o => o[valueProp.value]).indexOf(option[valueProp.value]) !== -1
    })
  }

  // no export
  /* istanbul ignore next */
  const adjustWrapperScrollToPointer = () => {
    let pointedOption = multiselect.value.querySelector(`[data-pointed]`)

    if (!pointedOption) {
      return
    }

    let wrapper = pointedOption.parentElement.parentElement

    if (pointedOption.offsetTop + pointedOption.offsetHeight > wrapper.clientHeight + wrapper.scrollTop) {
      wrapper.scrollTop = pointedOption.offsetTop + pointedOption.offsetHeight - wrapper.clientHeight
    }
    
    if (pointedOption.offsetTop < wrapper.scrollTop) {
      wrapper.scrollTop = pointedOption.offsetTop
    }
  }

  // ============== WATCHERS ==============

  watch(search, (val) => {
    if (searchable.value) {
      if (val.length && showOptions.value) {
        setPointerFirst()
      } else {
        clearPointer()
      }
    }
  })

  return {
    pointer,
    isPointed,
    setPointerFirst,
    selectPointer,
    forwardPointer,
    backwardPointer,
  }
}