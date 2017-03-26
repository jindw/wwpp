$if{nsName}package ${nsName};$end$

public class ${className}{
$for{innerClass in innerClasses}
    public static class ${innerClass.className}{
    $for{attr in innerClass.attributes}
        $if{attr.description}
        /*$for{line in attr.description.split(/\r\n|\n/)}
         * ${line} $end$
         */
        $end$
        public ${attr.type} ${attr.name};
    $end$
    }
$end$

$for{attr in attributes}
    $if{attr.description}
    /*$for{line in attr.description.split(/\r\n|\n/)}
     * ${line} $end$
     */
    $end$
    public ${attr.type} ${attr.name};
$end$
}